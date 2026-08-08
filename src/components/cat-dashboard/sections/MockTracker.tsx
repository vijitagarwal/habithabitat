import { useState, useEffect } from "react";
import { supabase } from "../bridge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { useToast } from "../bridge/useCatToast";
import { format } from "date-fns";
import { useKV } from "../bridge";
import { DATE_CFG } from "../data/dates";
import { getStatus } from "../engine/schedule";

interface MockTest {
  id: string;
  date: string;
  test_name: string;
  varc_attempts: number;
  varc_correct: number;
  varc_score: number;
  dilr_attempts: number;
  dilr_correct: number;
  dilr_score: number;
  qa_attempts: number;
  qa_correct: number;
  qa_score: number;
  total_score: number;
  percentile?: number;
  notes?: string;
}

function MockTracker() {
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [formData, setFormData] = useState({
    test_name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    varc_attempts: 0,
    varc_correct: 0,
    dilr_attempts: 0,
    dilr_correct: 0,
    qa_attempts: 0,
    qa_correct: 0,
    notes: "",
  });
  const { value: targetScore, setValue: setTargetScore } = useKV<number>("mock_target_score", 100);

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState(targetScore.toString());

  const fetchMockTests = async () => {
  const { addToast } = useToast();
  const { data, error } = await supabase
    .from("mock_tests")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    addToast(`Error fetching mock tests: ${error.message}`, "error");
  } else {
    setMockTests(data || []);
  }
  };

  useEffect(() => {
    fetchMockTests();
  }, []);

  const calculateScore = (attempts: number, correct: number) => {
    return (correct * 3) - ((attempts - correct) * 1);
  };

  const { addToast } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const varc_score = calculateScore(formData.varc_attempts, formData.varc_correct);
    const dilr_score = calculateScore(formData.dilr_attempts, formData.dilr_correct);
    const qa_score = calculateScore(formData.qa_attempts, formData.qa_correct);
    const total_score = varc_score + dilr_score + qa_score;

    const { error } = await supabase.from("mock_tests").insert([{
      test_name: formData.test_name,
      date: formData.date,
      varc_attempts: formData.varc_attempts,
      varc_correct: formData.varc_correct,
      varc_score,
      dilr_attempts: formData.dilr_attempts,
      dilr_correct: formData.dilr_correct,
      dilr_score,
      qa_attempts: formData.qa_attempts,
      qa_correct: formData.qa_correct,
      qa_score,
      total_score,
      notes: formData.notes,
    }]);

    if (error) {
      addToast(`Error saving mock test: ${error.message}`, "error");
    } else {
      addToast("Your mock test has been logged successfully.", "success");
      setFormData({
        test_name: "",
        date: format(new Date(), "yyyy-MM-dd"),
        varc_attempts: 0,
        varc_correct: 0,
        dilr_attempts: 0,
        dilr_correct: 0,
        qa_attempts: 0,
        qa_correct: 0,
        notes: "",
      });
      fetchMockTests();
    }
  };

  const latestScore = mockTests.length > 0 ? mockTests[mockTests.length - 1].total_score : null;
  const trajectory = latestScore === null ? "No data" : latestScore >= targetScore ? "On track 🚀" : "Behind target 📉";
  
  const today = new Date();
  const phase = getStatus(today, DATE_CFG).phase;
  let suggestedTarget = 80;
  if (phase === "Phase 2") suggestedTarget = 120;
  if (phase === "Phase 3") suggestedTarget = 160;

  return (
    <div className="space-y-6">
      <Card className="card-glass">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Mock Test Score Progression</CardTitle>
          <div className="text-sm font-medium px-3 py-1 rounded-full bg-background/50 border border-border">
            Status: <span className={latestScore && latestScore >= targetScore ? "text-success" : "text-amber-500"}>{trajectory}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center justify-between rounded-xl bg-black/20 p-4 border border-border/50">
            <div>
              <div className="text-sm text-muted-foreground">Current Target Score</div>
              {isEditingTarget ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    type="number" 
                    value={tempTarget} 
                    onChange={(e) => setTempTarget(e.target.value)} 
                    className="w-24 h-8"
                  />
                  <Button size="sm" onClick={() => {
                    setTargetScore(Number(tempTarget));
                    setIsEditingTarget(false);
                  }}>Save</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-1">
                  <div className="text-2xl font-bold text-teal-400">{targetScore}</div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setTempTarget(targetScore.toString());
                    setIsEditingTarget(true);
                  }}>Edit</Button>
                </div>
              )}
            </div>
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Suggested for {phase}</div>
              <div className="font-semibold text-amber-400">{suggestedTarget}</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockTests}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
              />
              <YAxis domain={[0, 300]} />
              <Tooltip
                labelFormatter={(date) => format(new Date(date), "MMM dd, yyyy")}
                formatter={(value: number) => [`${value}`, "Score"]}
              />
              <ReferenceLine y={targetScore} stroke="var(--teal)" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fill: 'var(--teal)' }} />
              <Line
                type="monotone"
                dataKey="total_score"
                stroke="var(--amber)"
                strokeWidth={2}
                dot={{ fill: "var(--amber)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="card-glass">
        <CardHeader>
          <CardTitle>Log a New Mock Test</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test_name">Test Name</Label>
                <Input
                  id="test_name"
                  value={formData.test_name}
                  onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">VARC</h3>
                <div>
                  <Label htmlFor="varc_attempts">Attempts</Label>
                  <Input
                    id="varc_attempts"
                    type="number"
                    min={0}
                    value={formData.varc_attempts}
                    onChange={(e) => setFormData({ ...formData, varc_attempts: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="varc_correct">Correct</Label>
                  <Input
                    id="varc_correct"
                    type="number"
                    min={0}
                    max={formData.varc_attempts}
                    value={formData.varc_correct}
                    onChange={(e) => setFormData({ ...formData, varc_correct: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">DILR</h3>
                <div>
                  <Label htmlFor="dilr_attempts">Attempts</Label>
                  <Input
                    id="dilr_attempts"
                    type="number"
                    min={0}
                    value={formData.dilr_attempts}
                    onChange={(e) => setFormData({ ...formData, dilr_attempts: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dilr_correct">Correct</Label>
                  <Input
                    id="dilr_correct"
                    type="number"
                    min={0}
                    max={formData.dilr_attempts}
                    value={formData.dilr_correct}
                    onChange={(e) => setFormData({ ...formData, dilr_correct: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">QA</h3>
                <div>
                  <Label htmlFor="qa_attempts">Attempts</Label>
                  <Input
                    id="qa_attempts"
                    type="number"
                    min={0}
                    value={formData.qa_attempts}
                    onChange={(e) => setFormData({ ...formData, qa_attempts: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="qa_correct">Correct</Label>
                  <Input
                    id="qa_correct"
                    type="number"
                    min={0}
                    max={formData.qa_attempts}
                    value={formData.qa_correct}
                    onChange={(e) => setFormData({ ...formData, qa_correct: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <Button type="submit" className="gradient-amber-teal">
              Save Mock Test
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default MockTracker;
