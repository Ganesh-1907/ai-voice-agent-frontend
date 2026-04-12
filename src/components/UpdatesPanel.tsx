import { FormEvent, useState } from "react";

import { ApiError, api } from "../api";
import type { Business, BusinessUpdate } from "../types";

type Props = {
  business: Business;
  updates: BusinessUpdate[];
  onReload: () => Promise<void>;
};

export function UpdatesPanel({ business, updates, onReload }: Props) {
  const [approvalNote, setApprovalNote] = useState("");
  const [status, setStatus] = useState("Review pending updates and approve to trigger WhatsApp.");
  const [workingUpdateId, setWorkingUpdateId] = useState<string | null>(null);

  async function handleApprove(event: FormEvent, updateId: string) {
    event.preventDefault();
    try {
      setWorkingUpdateId(updateId);
      await api.approveUpdate(business.id, updateId, { approvalNote: approvalNote.trim() || undefined });
      setApprovalNote("");
      await onReload();
      setStatus("Update approved and WhatsApp confirmation sent.");
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setWorkingUpdateId(null);
    }
  }

  async function handleCallbackCompleted(updateId: string) {
    try {
      setWorkingUpdateId(updateId);
      await api.markCallbackCompleted(business.id, updateId, {});
      await onReload();
      setStatus("Callback marked as completed.");
    } catch (error) {
      setStatus(formatError(error));
    } finally {
      setWorkingUpdateId(null);
    }
  }

  return (
    <section className="panel card">
      <div className="panel-head">
        <h3>Business Updates</h3>
        <p>Post-call requests like orders, pre-orders, table bookings, and callback asks land here.</p>
      </div>

      <label>
        Approval note (optional)
        <input
          value={approvalNote}
          onChange={(event) => setApprovalNote(event.target.value)}
          placeholder="Your order is confirmed for tomorrow"
        />
      </label>

      <p className="muted">{status}</p>

      <div className="list-stack">
        {updates.length === 0 ? <p className="muted">No updates found yet.</p> : null}
        {updates.map((update) => (
          <article className="list-item" key={update.id}>
            <div>
              <strong>{update.requestType.replace("_", " ")}</strong>
              <p>{update.summary}</p>
              <p className="muted">From: {update.fromNumber} | Status: {update.status}</p>
              <p className="muted">
                Customer: {update.customerName || "Not captured"} | Mobile: {update.customerMobile || "Not captured"}
              </p>
              <p className="muted">
                Messaged: {update.messagedToCustomer ? "Yes" : "No"}
                {update.messagedAt ? ` at ${new Date(update.messagedAt).toLocaleString()}` : ""}
                {" | "}
                Called Back: {update.calledBack ? "Yes" : "No"}
                {update.calledBackAt ? ` at ${new Date(update.calledBackAt).toLocaleString()}` : ""}
              </p>
            </div>
            {update.status === "pending" ? (
              <form onSubmit={(event) => void handleApprove(event, update.id)}>
                <button type="submit" disabled={workingUpdateId === update.id}>
                  {workingUpdateId === update.id ? "Approving..." : "Approve + WhatsApp"}
                </button>
              </form>
            ) : update.status === "callback_scheduled" && !update.calledBack ? (
              <button
                type="button"
                onClick={() => void handleCallbackCompleted(update.id)}
                disabled={workingUpdateId === update.id}
              >
                {workingUpdateId === update.id ? "Updating..." : "Mark Callback Completed"}
              </button>
            ) : (
              <span className="muted">Processed</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function formatError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return error instanceof Error ? error.message : "Request failed";
}
