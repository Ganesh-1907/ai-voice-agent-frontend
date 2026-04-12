import { FormEvent, useState } from "react";

type Props = {
  onLogin: (input: { email: string; password: string }) => Promise<void>;
  onRegister: (input: { name: string; email: string; password: string }) => Promise<void>;
};

export function AuthPanel({ onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await onLogin({ email, password });
      } else {
        await onRegister({ name, email, password });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-brand">
        <span className="eyebrow">AI Voice Operations</span>
        <h1>Run every forwarded business call through one AI control room.</h1>
        <p>
          Onboard businesses, test voice conversations in-browser, and track transcripts, summaries,
          and call performance from a single dashboard.
        </p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="mode-switch">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Register
          </button>
        </div>

        {mode === "register" ? (
          <label>
            Full name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
        ) : null}

        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login to Dashboard" : "Create account"}
        </button>
      </form>
    </section>
  );
}
