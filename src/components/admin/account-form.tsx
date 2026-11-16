"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleCheck, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountForm({ first, mustChange, minLength }: { first: boolean; mustChange: boolean; minLength: number }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<{ field?: string; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (next !== confirm) return setError({ field: "confirm", text: "The new passwords don't match." });
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError({ field: json.field, text: json.error ?? "Couldn't change the password." });
      } else {
        setDone(true);
        setCurrent("");
        setNext("");
        setConfirm("");
        if (mustChange) {
          router.replace(json.next ?? "/admin");
          router.refresh();
        }
      }
    } catch {
      setError({ text: "Could not reach the server." });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-8 rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-forest-900">
        <KeyRound className="h-5 w-5 text-forest-700" /> {first ? "Choose your own password" : "Change password"}
      </h2>
      {first && (
        <p className="mt-2 rounded-xl bg-amber-500/15 p-3 text-sm font-semibold text-forest-900">
          You signed in with a temporary password. Choose your own before you continue.
        </p>
      )}
      <p className="mt-2 text-sm text-forest-900/70">
        At least {minLength} characters. A short sentence works well, e.g. “four goats climbed Kilang”. Changing it signs
        you out on your other devices.
      </p>

      {(
        [
          ["current", first ? "Temporary password" : "Current password", current, setCurrent, "current-password"],
          ["next", "New password", next, setNext, "new-password"],
          ["confirm", "Repeat new password", confirm, setConfirm, "new-password"],
        ] as const
      ).map(([id, label, value, set, auto]) => (
        <div key={id} className="mt-4">
          <label htmlFor={id} className="field-label">
            {label}
          </label>
          <input
            id={id}
            type="password"
            autoComplete={auto}
            required
            minLength={id === "current" ? 1 : minLength}
            className="field-input"
            value={value}
            onChange={(e) => set(e.target.value)}
            aria-invalid={error?.field === id}
          />
        </div>
      ))}

      {error && (
        <p role="alert" className="field-error">
          {error.text}
        </p>
      )}
      {done && !mustChange && (
        <p role="status" className="mt-3 flex items-center gap-2 text-sm font-bold text-forest-700">
          <CircleCheck className="h-4 w-4" /> Password changed.
        </p>
      )}

      <Button type="submit" variant="forest" className="mt-6" disabled={busy || !current || !next || !confirm}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" />} Save password
      </Button>
    </form>
  );
}
