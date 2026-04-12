import { FormEvent, useState } from "react";

type Props = {
  onResetPassword: (input: { email: string; newPassword: string }) => Promise<{ email: string }>;
};

export function DevToolsPanel({ onResetPassword }: Props) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("Resetting password...");

    try {
      const response = await onResetPassword({ email, newPassword });
      setStatus(`Password reset successful for ${response.email}`);
      setNewPassword("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel-grid">
      <form className="panel card form-stack" onSubmit={handleSubmit}>
        <div className="panel-head">
          <h3>Dev tools</h3>
          <p>Reset a single user password by email (dev/admin endpoint).</p>
        </div>

        <label>
          User email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Reset password"}
        </button>

        {status ? <p className="muted">{status}</p> : null}
      </form>
    </section>
  );
}
