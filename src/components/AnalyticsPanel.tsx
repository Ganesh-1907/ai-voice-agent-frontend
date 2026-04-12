import type { CallRecord, CallsAnalytics } from "../types";

type Props = {
  analytics: CallsAnalytics | null;
  calls: CallRecord[];
  selectedCall: CallRecord | null;
  onSelectCall: (call: CallRecord) => void;
};

export function AnalyticsPanel({ analytics, calls, selectedCall, onSelectCall }: Props) {
  return (
    <section className="panel-grid analytics-grid">
      <div className="panel card">
        <div className="panel-head">
          <h3>Call analytics</h3>
          <p>Live summary of completed, active, and failed conversations.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><span>Total</span><strong>{analytics?.totalCalls ?? 0}</strong></div>
          <div className="stat-card"><span>Completed</span><strong>{analytics?.completedCalls ?? 0}</strong></div>
          <div className="stat-card"><span>In progress</span><strong>{analytics?.inProgressCalls ?? 0}</strong></div>
          <div className="stat-card"><span>Avg duration</span><strong>{analytics?.averageDurationSeconds ?? 0}s</strong></div>
        </div>

        <div className="list-stack">
          {calls.map((call) => (
            <button type="button" key={call.id} className="call-row" onClick={() => onSelectCall(call)}>
              <div>
                <strong>{call.status.toUpperCase()}</strong>
                <p>{new Date(call.createdAt).toLocaleString()}</p>
              </div>
              <span>{call.fromNumber}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel card transcript-card">
        <div className="panel-head">
          <h3>Transcript and summary</h3>
          <p>Use this to audit what the AI said and how each call ended.</p>
        </div>
        {selectedCall ? (
          <>
            <div className="summary-box">
              <strong>Summary</strong>
              <p>{selectedCall.summary || "Summary not available yet."}</p>
            </div>
            <div className="summary-box">
              <strong>Transcript</strong>
              <pre>{selectedCall.transcript || "Transcript not available yet."}</pre>
            </div>
          </>
        ) : (
          <p className="muted">Select a call to inspect transcript details.</p>
        )}
      </div>
    </section>
  );
}
