type Props = {
  health: { ok: boolean; service: string; timestamp: string } | null;
};

export function HealthPanel({ health }: Props) {
  return (
    <section className="panel card">
      <div className="panel-head">
        <h3>System health</h3>
        <p>Public health endpoint visibility for the backend.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span>Status</span><strong>{health?.ok ? "Healthy" : "Unknown"}</strong></div>
        <div className="stat-card"><span>Service</span><strong>{health?.service ?? "Unavailable"}</strong></div>
      </div>
      <div className="summary-box">
        <strong>Timestamp</strong>
        <p>{health?.timestamp ?? "No response yet."}</p>
      </div>
    </section>
  );
}
