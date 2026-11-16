"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok) {
        const target = json.next?.startsWith("/admin/account") ? json.next : (next ?? json.next);
        router.replace(target);
        router.refresh();
        return;
      }
      setError(json.error ?? "Could not sign in.");
    } catch {
      setError("Could not reach the server. Check your connection.");
    }
    setBusy(false);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-forest-900 px-5 py-10">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-lift">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-500 text-ink">
          <Mountain className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 text-3xl font-semibold text-forest-900">Staff sign-in</h1>
        <p className="mt-2 text-sm text-forest-900/70">Kilang Expedition 2026 back office.</p>

        <label htmlFor="email" className="field-label mt-6">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password" className="field-label mt-4">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "login-error" : undefined}
        />
        {error && (
          <p id="login-error" role="alert" className="field-error">
            {error}
          </p>
        )}

        <Button type="submit" variant="forest" className="mt-6 w-full" disabled={busy || !email || !password}>
          {busy && <Loader2 className="h-5 w-5 animate-spin" />} Sign in
        </Button>
        <p className="mt-5 text-center text-xs text-forest-900/60">
          Forgot your password? Ask an expedition admin to reset it.
        </p>
      </form>
    </main>
  );
}
