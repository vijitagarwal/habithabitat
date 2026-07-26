import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[Mission CAT] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0B0F17",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
            padding: 24,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div style={{ fontSize: "2rem" }}>⚠️</div>
          <div style={{ color: "#E8A23D", fontWeight: 700, fontSize: "1.1rem" }}>
            Something crashed
          </div>
          <div
            style={{
              color: "#9ca3af",
              fontSize: "0.85rem",
              maxWidth: 600,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {this.state.error.message}
          </div>
          <pre
            style={{
              background: "#161b27",
              border: "1px solid #2a3140",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#e2614f",
              fontSize: "0.72rem",
              maxWidth: "90vw",
              overflow: "auto",
              maxHeight: 200,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#E8A23D",
              color: "#0B0F17",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
