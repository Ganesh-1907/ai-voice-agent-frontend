import { FormEvent, useState } from "react";

import type { Lead } from "../types";

type Props = {
  leads: Lead[];
  onCreateLead: (input: { name?: string; phone: string; intent?: string; notes?: string }) => Promise<void>;
};

export function LeadsPanel({ leads, onCreateLead }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState("");
  const [notes, setNotes] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onCreateLead({ name, phone, intent, notes });
    setName("");
    setPhone("");
    setIntent("");
    setNotes("");
  }

  return (
    <section className="panel-grid">
      <div className="panel card">
        <div className="panel-head">
          <h3>Manual lead entry</h3>
          <p>Add leads outside the call flow if your team captures them elsewhere.</p>
        </div>
        <form className="form-stack" onSubmit={submit}>
          <input placeholder="Lead name" value={name} onChange={(event) => setName(event.target.value)} />
          <input placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          <input placeholder="Intent" value={intent} onChange={(event) => setIntent(event.target.value)} />
          <textarea placeholder="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <button className="primary-button" type="submit">
            Save lead
          </button>
        </form>
      </div>

      <div className="panel card">
        <div className="panel-head">
          <h3>Leads</h3>
          <p>Captured from calls or added manually.</p>
        </div>
        <div className="list-stack">
          {leads.map((lead) => (
            <article key={lead.id} className="list-card">
              <strong>{lead.name || "Unnamed lead"}</strong>
              <p>{lead.phone}</p>
              <p>{lead.intent || "No intent yet"}</p>
              <p>{lead.notes || "No notes"}</p>
            </article>
          ))}
          {leads.length === 0 ? <p className="muted">No leads yet.</p> : null}
        </div>
      </div>
    </section>
  );
}
