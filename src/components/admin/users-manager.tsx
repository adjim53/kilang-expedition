"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, Loader2, Plus, ShieldOff, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_INFO, ROLES, type Role } from "@/lib/auth/roles";
import { cn, formatWAT } from "@/lib/utils";

type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

/** Shown once after creating a user or resetting a password. */
function TemporaryPassword({ who, password, onClose }: { who: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="temp-title" className="fixed inset-0 z-50 grid place-items-center bg-forest-950/80 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lift">
        <h2 id="temp-title" className="text-2xl font-semibold text-forest-900">Temporary password for {who}</h2>
        <p className="mt-2 text-sm text-forest-900/75">
          Give it to them in person or by phone — not in a group chat. It is shown <strong>only now</strong>. They must
          choose their own password when they first sign in.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-sand-100 p-3">
          <code className="flex-1 select-all break-all font-mono text-lg font-bold text-forest-900">{password}</code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(password).then(() => setCopied(true));
            }}
          >
            <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <Button variant="forest" className="mt-6 w-full" onClick={onClose}>
          I&apos;ve passed it on
        </Button>
      </div>
    </div>
  );
}

function AddUser({ onCreated }: { onCreated: (u: User, password: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MARSHAL");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button variant="forest" onClick={() => setOpen(true)}>
        <Plus className="h-5 w-5" /> Add user
      </Button>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Couldn't create the user.");
      else {
        onCreated(json.user, json.temporaryPassword);
        setOpen(false);
        setName("");
        setEmail("");
        setRole("MARSHAL");
      }
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="w-full rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-forest-900">Add a user</h2>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-sand-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new-name" className="field-label">Name</label>
          <input id="new-name" className="field-input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="new-email" className="field-label">Email</label>
          <input id="new-email" type="email" className="field-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <fieldset className="mt-4">
        <legend className="field-label">Role</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <label
              key={r}
              className={cn(
                "cursor-pointer rounded-xl border-2 p-3 text-sm transition",
                role === r ? "border-forest-700 bg-forest-50" : "border-sand-200 hover:border-sand-300",
              )}
            >
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
              <span className="font-bold text-forest-900">{ROLE_INFO[r].label}</span>
              <span className="mt-1 block text-forest-900/70">{ROLE_INFO[r].description}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p role="alert" className="field-error">{error}</p>}
      <Button type="submit" variant="forest" className="mt-5" disabled={busy}>
        {busy && <Loader2 className="h-5 w-5 animate-spin" />} Create and get temporary password
      </Button>
    </form>
  );
}

export function UsersManager({ meId }: { meId: string }) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [temp, setTemp] = useState<{ who: string; password: string } | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!live) return;
        if (!res.ok) setError(json.error ?? "Couldn't load users.");
        else setUsers(json.users);
      })
      .catch(() => live && setError("Could not reach the server."));
    return () => {
      live = false;
    };
  }, []);

  async function patch(user: User, body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Couldn't update the user.");
      else {
        setUsers((list) => list?.map((u) => (u.id === user.id ? json.user : u)) ?? null);
        if (json.temporaryPassword) setTemp({ who: user.name, password: json.temporaryPassword });
      }
    } catch {
      setError("Could not reach the server.");
    }
    setBusyId(null);
  }

  return (
    <main className="container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">Users</h1>
          <p className="mt-1 text-sm text-forest-900/70">Everyone who can sign in to the back office. One account per person — never share logins.</p>
        </div>
      </div>

      <div className="mt-6">
        <AddUser
          onCreated={(u, password) => {
            setUsers((list) => [...(list ?? []), u]);
            setTemp({ who: u.name, password });
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-clay-500/10 p-4 text-sm font-bold text-clay-600">
          <TriangleAlert className="h-4 w-4" /> {error}
        </p>
      )}

      {!users ? (
        <p className="mt-8 flex items-center gap-2 text-forest-900/70"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {users.map((u) => {
            const me = u.id === meId;
            const busy = busyId === u.id;
            return (
              <li key={u.id} className={cn("rounded-2xl border bg-white p-5 shadow-sm", u.active ? "border-sand-200" : "border-dashed border-sand-300 opacity-70")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-xl font-semibold text-forest-900">
                      {u.name} {me && <span className="text-sm font-normal text-forest-900/60">(you)</span>}
                    </p>
                    <p className="truncate text-sm text-forest-900/70">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {!u.active && <Badge variant="warn">Deactivated</Badge>}
                    {u.active && u.mustChangePassword && <Badge variant="sand">Temporary password</Badge>}
                  </div>
                </div>
                <p className="mt-2 text-xs text-forest-900/60">
                  Last sign-in: {u.lastLoginAt ? formatWAT(u.lastLoginAt) : "never"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-4">
                  <label className="sr-only" htmlFor={`role-${u.id}`}>Role for {u.name}</label>
                  <select
                    id={`role-${u.id}`}
                    className="field-input w-auto py-2 text-sm"
                    value={u.role}
                    disabled={busy || me}
                    onChange={(e) =>
                      patch(u, { action: "update", role: e.target.value }, `Change ${u.name}'s role to ${ROLE_INFO[e.target.value as Role].label}? They will be signed out.`)
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_INFO[r].label}</option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy || !u.active}
                    onClick={() => patch(u, { action: "reset_password" }, `Reset ${u.name}'s password? They will be signed out everywhere and get a new temporary password.`)}
                  >
                    <KeyRound className="h-4 w-4" /> Reset password
                  </Button>
                  {!me &&
                    (u.active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-clay-600 hover:bg-clay-500/10"
                        disabled={busy}
                        onClick={() => patch(u, { action: "update", active: false }, `Deactivate ${u.name}? They are signed out at once and can't sign in again until reactivated.`)}
                      >
                        <ShieldOff className="h-4 w-4" /> Deactivate
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => patch(u, { action: "update", active: true })}>
                        <ShieldCheck className="h-4 w-4" /> Reactivate
                      </Button>
                    ))}
                  {busy && <Loader2 className="h-4 w-4 animate-spin text-forest-700" />}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {temp && <TemporaryPassword who={temp.who} password={temp.password} onClose={() => setTemp(null)} />}
    </main>
  );
}
