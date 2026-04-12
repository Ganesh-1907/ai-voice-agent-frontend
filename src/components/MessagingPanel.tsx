type Props = {
  businessName: string;
};

export function MessagingPanel({ businessName }: Props) {
  return (
    <section className="panel card">
      <div className="panel-head">
        <h3>Messaging</h3>
        <p>WhatsApp follow-up is intentionally disabled right now.</p>
      </div>
      <div className="summary-box">
        <strong>{businessName}</strong>
        <p>
          The backend message route exists, but delivery is disabled by current product scope. This page is
          reserved for future WhatsApp templates, delivery logs, and manual resend tools.
        </p>
      </div>
    </section>
  );
}
