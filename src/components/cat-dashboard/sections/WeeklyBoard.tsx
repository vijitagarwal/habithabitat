import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../bridge";
import { useAuth } from "../bridge";
import { useRealtime } from "../bridge";
import { useActivity } from "../bridge";
import { useToast } from "../bridge";
import { Modal } from "../ui/Modal";
import type { BoardCard } from "../types";

const COLUMNS: { id: BoardCard["column_id"]; label: string }[] = [
  { id: "focus_now", label: "Focus Now" },
  { id: "today", label: "Today" },
  { id: "this_week", label: "This Week" },
  { id: "backlog", label: "Backlog" },
  { id: "done", label: "Done" },
];

function score(c: BoardCard) {
  return c.impact * 2 + c.urgency * 2 - c.effort;
}

function SortableCard({
  card,
  onEdit,
  onDelete,
}: {
  card: BoardCard;
  onEdit: (c: BoardCard) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id!,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="board-card" {...attributes} {...listeners}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "var(--text-primary)",
            marginRight: 8,
          }}
        >
          {card.title}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onEdit(card)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "0.75rem",
              padding: 2,
            }}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(card.id!)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "0.75rem",
              padding: 2,
            }}
          >
            ✕
          </button>
        </div>
      </div>
      {card.description && (
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            margin: "4px 0",
            lineHeight: 1.4,
          }}
        >
          {card.description}
        </p>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
        }}
      >
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(card.tags || []).map((tag) => (
            <span
              key={tag}
              style={{
                padding: "1px 6px",
                borderRadius: 4,
                background: "var(--bg-deep)",
                fontSize: "0.68rem",
                color: "var(--text-muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <span
          style={{
            fontSize: "0.72rem",
            background: "var(--amber-dim)",
            color: "var(--amber)",
            padding: "2px 6px",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          {score(card)}
        </span>
      </div>
    </div>
  );
}

export default function WeeklyBoard() {
  const { user } = useAuth();
  const { markActivity } = useActivity();
  const { addToast } = useToast();
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [editCard, setEditCard] = useState<BoardCard | null>(null);
  const [addColId, setAddColId] = useState<BoardCard["column_id"] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    impact: 3,
    urgency: 3,
    effort: 2,
    tags: "",
  });

  const loadCards = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("board_cards")
      .select("*")
      .eq("user_id", user.id)
      .order("position");
    if (data) setCards(data as BoardCard[]);
  }, [user]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);
  useRealtime("board_cards", loadCards);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id || !user) return;

    const fromIdx = cards.findIndex((c) => c.id === active.id);
    const toIdx = cards.findIndex((c) => c.id === over.id);
    if (fromIdx === -1 || toIdx === -1) return;

    const toCard = cards[toIdx];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newCards = arrayMove(cards, fromIdx, toIdx).map((c: any, i: number) => ({
      ...c,
      position: i,
    }));
    const movedCard = {
      ...newCards.find((c: any) => c.id === active.id)!,
      column_id: toCard.column_id,
    };
    const final = newCards.map((c: any) => (c.id === active.id ? movedCard : c));
    setCards(final);

    // Save to Supabase
    await supabase
      .from("board_cards")
      .update({ column_id: movedCard.column_id })
      .eq("id", active.id);
    await markActivity(2);
    addToast("Card moved");
  };

  const handleDelete = async (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("board_cards").delete().eq("id", id);
    addToast("Card deleted");
  };

  const handleSave = async () => {
    if (!user || !form.title.trim()) return;
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const cardData = {
      user_id: user.id,
      title: form.title,
      description: form.description,
      column_id: editCard ? editCard.column_id : addColId || "backlog",
      tags,
      impact: form.impact,
      urgency: form.urgency,
      effort: form.effort,
      position: 0,
    };
    if (editCard?.id) {
      await supabase.from("board_cards").update(cardData).eq("id", editCard.id);
      addToast("Card updated");
    } else {
      await supabase.from("board_cards").insert(cardData);
      addToast("Card added");
    }
    setEditCard(null);
    setAddColId(null);
    setForm({ title: "", description: "", impact: 3, urgency: 3, effort: 2, tags: "" });
    loadCards();
  };

  const openEdit = (card: BoardCard) => {
    setEditCard(card);
    setForm({
      title: card.title,
      description: card.description || "",
      impact: card.impact,
      urgency: card.urgency,
      effort: card.effort,
      tags: (card.tags || []).join(", "),
    });
  };

  const openAdd = (colId: BoardCard["column_id"]) => {
    setAddColId(colId);
    setEditCard(null);
    setForm({ title: "", description: "", impact: 3, urgency: 3, effort: 2, tags: "" });
  };

  const closeModal = () => {
    setEditCard(null);
    setAddColId(null);
  };

  const rebalance = async () => {
    if (!user) return;
    const sorted = [...cards]
      .filter((c) => c.column_id !== "done")
      .sort((a, b) => score(b) - score(a));
    const done = cards.filter((c) => c.column_id === "done");
    const final = [...sorted, ...done].map((c, i) => ({ ...c, position: i }));
    setCards(final);
    for (const c of final)
      await supabase.from("board_cards").update({ position: c.position }).eq("id", c.id!);
    await markActivity(1);
    addToast("Board rebalanced by score");
  };

  const colCards = (colId: string) =>
    cards
      .filter((c) => c.column_id === colId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <section id="weeklyboard" className="section">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <p className="section-eyebrow">Planning</p>
          <h2 className="section-title">Weekly Board</h2>
        </div>
        <button id="rebalance-board" className="btn btn-ghost btn-sm" onClick={rebalance}>
          ⚖ Rebalance
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e: import("@dnd-kit/core").DragStartEvent) =>
          setActiveId(String(e.active.id))
        }
        onDragEnd={handleDragEnd}
      >
        <div
          className="board-cols"
          style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}
        >
          {COLUMNS.map((col) => {
            const colC = colCards(col.id);
            return (
              <div key={col.id} className="board-col" style={{ minWidth: 180 }}>
                <div className="board-col-header">
                  <span>{col.label}</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--text-muted)" }}>
                    {colC.length}
                  </span>
                </div>
                <SortableContext
                  items={colC.map((c) => c.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  {colC.map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{
                    margin: 8,
                    width: "calc(100% - 16px)",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                  onClick={() => openAdd(col.id)}
                >
                  + Add card
                </button>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeId ? (
            <div
              className="board-card"
              style={{ opacity: 0.9, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
            >
              {cards.find((c) => c.id === activeId)?.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add/Edit modal */}
      <Modal
        open={!!(editCard || addColId)}
        onClose={closeModal}
        title={editCard ? "Edit card" : "Add card"}
        width={460}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label>Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Card title"
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              className="input"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {["impact", "urgency", "effort"].map((field) => (
              <div key={field}>
                <label>{field} (1-5)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={5}
                  value={form[field as keyof typeof form] as number}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>
          <div>
            <label>Tags (comma-separated)</label>
            <input
              className="input"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="CAT, Review, Daily"
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={closeModal}>
              Cancel
            </button>
            <button className="btn btn-amber" onClick={handleSave} disabled={!form.title.trim()}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
