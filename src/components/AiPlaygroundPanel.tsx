import { FormEvent, useState } from "react";

import { api } from "../api";
import type { Business } from "../types";

type Props = {
  business: Business;
};

export function AiPlaygroundPanel({ business }: Props) {
  const [customerText, setCustomerText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [status, setStatus] = useState("Ready");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("Generating reply...");
    const response = await api.aiReply(business.id, customerText);
    setReply(response.replyText);
    setStatus("Done");
  }

  return (
    <section className="panel-grid">
      <form className="panel card form-stack" onSubmit={submit}>
        <div className="panel-head">
          <h3>AI sandbox</h3>
          <p>Test the business knowledge base against the direct AI reply route.</p>
        </div>
        <textarea value={customerText} onChange={(event) => setCustomerText(event.target.value)} placeholder="Ask a customer question" required />
        <button className="primary-button" type="submit">
          Generate AI reply
        </button>
        <p className="muted">{status}</p>
      </form>

      <div className="panel card">
        <div className="panel-head">
          <h3>Reply</h3>
          <p>Direct response from the AI business context endpoint.</p>
        </div>
        <div className="summary-box">
          <p>{reply || "No reply yet."}</p>
        </div>
      </div>
    </section>
  );
}
