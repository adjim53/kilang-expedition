"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CircleCheck,
  History,
  Link2,
  Loader2,
  Pencil,
  Printer,
  RotateCcw,
  Send,
  TicketCheck,
  TriangleAlert,
} from "lucide-react";
import type { RegistrationDetail } from "@/lib/registrations";
import { BLOOD_GROUPS, EXPERIENCE_LABELS, EXPERIENCE_LEVELS, GENOTYPES, KIT_SIZES } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { cn, displayPhone, formatNaira, formatWAT } from "@/lib/utils";

type HistoryItem = { id: string; at: string; who: string; action: string; details: string | null };
type Permissions = { edit: boolean; resend: boolean; cancel: boolean };
type Loaded =
  | { error: string }
  | { registration: RegistrationDetail; history: HistoryItem[]; permissions: Permissions };

async function fetchRegistration(id: string): Promise<Loaded> {
  try {
    const res = await fetch(`/api/admin/registrations/${id}`, { cache: "no-store" });
    const json = await res.json();
    return res.ok ? json : { error: json.error ?? "Couldn't load this registration." };
  } catch {
    return { error: "Could not reach the server." };
  }
}

type Action = "resend" | "confirm" | "regenerate_link" | "cancel" | "reinstate";

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-forest-900/50">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold text-forest-900">{children || "—"}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-forest-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EditForm({ r, onSaved, onCancel }: { r: RegistrationDetail; onSaved: (r: RegistrationDetail, h: HistoryItem[]) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    fullName: r.fullName,
    email: r.email,
    phone: displayPhone(r.phone),
    nextOfKinName: r.nextOfKinName,
    nextOfKinPhone: displayPhone(r.nextOfKinPhone),
    bloodGroup: r.bloodGroup,
    genotype: r.genotype,
    experience: r.experience,
    medicalNotes: r.medicalNotes ?? "",
    kitSize: r.kitSize,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Couldn't save.");
      else onSaved(json.registration, json.history);
    } catch {
      setError("Could not reach the server.");
    }
    setBusy(false);
  }

  const text = (k: keyof typeof form, label: string, type = "text") => (
    <div>
      <label htmlFor={`e-${k}`} className="field-label">{label}</label>
      <input id={`e-${k}`} type={type} className="field-input" value={form[k]} onChange={set(k)} required />
    </div>
  );
  const select = (k: keyof typeof form, label: string, options: readonly string[], labels?: Record<string, string>) => (
    <div>
      <label htmlFor={`e-${k}`} className="field-label">{label}</label>
      <select id={`e-${k}`} className="field-input" value={form[k]} onChange={set(k)}>
        {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={save} className="rounded-2xl border-2 border-forest-700 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-forest-900">Edit details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {text("fullName", "Full name")}
        {text("email", "Email", "email")}
        {text("phone", "Phone", "tel")}
        {select("kitSize", "Kit size", KIT_SIZES)}
        {text("nextOfKinName", "Next of kin")}
        {text("nextOfKinPhone", "Next of kin phone", "tel")}
        {select("bloodGroup", "Blood group", BLOOD_GROUPS)}
        {select("genotype", "Genotype", GENOTYPES)}
        {select("experience", "Experience", EXPERIENCE_LEVELS, EXPERIENCE_LABELS)}
        <div className="sm:col-span-2">
          <label htmlFor="e-medicalNotes" className="field-label">Medical notes / allergies</label>
          <textarea id="e-medicalNotes" rows={3} className="field-input" value={form.medicalNotes} onChange={set("medicalNotes")} />
        </div>
      </div>
      <p className="mt-3 text-xs text-forest-900/60">Changing the name or email does not resend the pass. Use “Resend pass” afterwards if needed.</p>
      {error && <p role="alert" className="field-error">{error}</p>}
      <div className="mt-5 flex gap-2">
        <Button type="submit" variant="forest" disabled={busy}>{busy && <Loader2 className="h-5 w-5 animate-spin" />} Save changes</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/** Small inline form for actions that need a reason or note. */
function ReasonForm({ title, label, cta, danger, onSubmit, onCancel }: { title: string; label: string; cta: string; danger?: boolean; onSubmit: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(text);
      }}
      className="mt-3 rounded-xl bg-sand-50 p-4"
    >
      <p className="font-bold text-forest-900">{title}</p>
      <label htmlFor="reason" className="field-label mt-2">{label}</label>
      <input id="reason" className="field-input" value={text} onChange={(e) => setText(e.target.value)} required minLength={3} autoFocus />
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" variant={danger ? "danger" : "forest"}>{cta}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Back</Button>
      </div>
    </form>
  );
}

export function RegistrationDetailView({ id }: { id: string }) {
  const [r, setR] = useState<RegistrationDetail | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [perm, setPerm] = useState<Permissions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);
  const [asking, setAsking] = useState<"cancel" | null>(null);

  const apply = useCallback((loaded: Loaded) => {
    if ("error" in loaded) return setError(loaded.error);
    setR(loaded.registration);
    setHistory(loaded.history);
    setPerm(loaded.permissions);
  }, []);

  const load = useCallback(() => fetchRegistration(id).then(apply), [id, apply]);

  useEffect(() => {
    let live = true;
    void fetchRegistration(id).then((loaded) => live && apply(loaded));
    return () => {
      live = false;
    };
  }, [id, apply]);

  async function act(action: Action, extra: Record<string, string> = {}, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action);
    setNotice(null);
    setAsking(null);
    try {
      const res = await fetch(`/api/admin/registrations/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      setNotice({ ok: res.ok && json.ok !== false, text: json.message ?? json.error ?? "Done." });
      await load();
    } catch {
      setNotice({ ok: false, text: "Could not reach the server. Nothing was changed." });
    }
    setBusy(null);
  }

  if (error) {
    return (
      <main className="container py-8">
        <p role="alert" className="rounded-xl bg-clay-500/10 p-4 font-bold text-clay-600">{error}</p>
        <Link href="/admin/registrations" className="mt-4 inline-flex items-center gap-1 font-bold text-forest-700"><ArrowLeft className="h-4 w-4" /> All registrations</Link>
      </main>
    );
  }
  if (!r || !perm) {
    return <main className="container py-8"><p className="flex items-center gap-2 text-forest-900/70"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p></main>;
  }

  const registered = r.status === "REGISTERED";
  const actionButton = (action: Action, label: string, Icon: React.ElementType, props: { confirm?: string; variant?: "forest" | "ghost" | "outline" | "danger" } = {}) => (
    <Button size="sm" variant={props.variant ?? "outline"} disabled={busy !== null} onClick={() => act(action, {}, props.confirm)}>
      {busy === action ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />} {label}
    </Button>
  );

  return (
    <main className="container max-w-5xl py-8">
      <Link href="/admin/registrations" className="inline-flex items-center gap-1 text-sm font-bold text-forest-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All registrations
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-forest-900">{r.fullName}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            {r.passId && <span className="font-mono font-bold text-forest-700">{r.passId}</span>}
            <StatusBadge status={r.status} />
          </p>
        </div>
        {perm.edit && !editing && r.status !== "CANCELLED" && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit details</Button>
        )}
      </header>

      {notice && (
        <p role="status" className={cn("mt-4 flex items-start gap-2 rounded-xl p-4 text-sm font-bold", notice.ok ? "bg-forest-100 text-forest-800" : "bg-clay-500/10 text-clay-600")}>
          {notice.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
          {notice.text}
        </p>
      )}

      {r.status === "CANCELLED" && (
        <p className="mt-4 rounded-xl bg-clay-500/10 p-4 text-sm font-semibold text-clay-600">
          Cancelled {formatWAT(r.cancelledAt)} — {r.cancelReason}
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {editing ? (
            <EditForm
              r={r}
              onCancel={() => setEditing(false)}
              onSaved={(next, h) => {
                setR(next);
                setHistory(h);
                setEditing(false);
                setNotice({ ok: true, text: "Details saved." });
              }}
            />
          ) : (
            <Section title="Climber">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">{r.email}</Field>
                <Field label="Phone"><a className="hover:underline" href={`tel:+${r.phone}`}>{displayPhone(r.phone)}</a></Field>
                <Field label="Next of kin">{r.nextOfKinName}</Field>
                <Field label="Next of kin phone"><a className="hover:underline" href={`tel:+${r.nextOfKinPhone}`}>{displayPhone(r.nextOfKinPhone)}</a></Field>
                <Field label="Blood group · genotype">{r.bloodGroup} · {r.genotype}</Field>
                <Field label="Experience">{EXPERIENCE_LABELS[r.experience as keyof typeof EXPERIENCE_LABELS] ?? r.experience}</Field>
                <Field label="Kit size">{r.kitSize}</Field>
                <Field label="Waiver accepted">{formatWAT(r.waiverAcceptedAt)}</Field>
                <Field label="Medical notes / allergies" wide>
                  {r.medicalNotes ? <span className="text-clay-600">{r.medicalNotes}</span> : "None given"}
                </Field>
              </dl>
            </Section>
          )}

          <Section title="Pass">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Registered">{formatWAT(r.createdAt)}</Field>
              <Field label="Reference"><span className="font-mono text-xs">{r.reference}</span></Field>
              <Field label="Pass email">
                {r.emailSentAt ? `Sent ${formatWAT(r.emailSentAt)}` : registered ? <span className="text-clay-600">Not delivered{r.emailError ? ` — ${r.emailError}` : ""}</span> : "—"}
              </Field>
              <Field label="Pass SMS">
                {r.smsSentAt ? `Sent ${formatWAT(r.smsSentAt)}` : registered ? <span className="text-clay-600">Not delivered{r.smsError ? ` — ${r.smsError}` : ""}</span> : "—"}
              </Field>
            </dl>
            {r.status === "PENDING" && (
              <p className="mt-4 rounded-xl bg-sand-50 p-3 text-sm text-forest-900/80">
                This climber started registering when registration still had a fee and never paid, so no pass was
                issued. Registration is free now: use “Confirm and issue pass” to register them.
              </p>
            )}
          </Section>

          <Section title="Checkpoints">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Medical checkup (Dec 30)">
                {r.medicalCheckedAt ? `Cleared ${formatWAT(r.medicalCheckedAt)}${r.medicalCheckedBy ? ` by ${r.medicalCheckedBy}` : ""}` : "Not yet"}
              </Field>
              <Field label="Ascent start (Dec 31)">
                {r.musterCheckedAt ? `Checked in ${formatWAT(r.musterCheckedAt)}${r.musterCheckedBy ? ` by ${r.musterCheckedBy}` : ""}` : "Not yet"}
              </Field>
              <Field label="Summit">
                {r.summitReachedAt ? `Reached ${formatWAT(r.summitReachedAt)}${r.summitReachedBy ? ` — scanned by ${r.summitReachedBy}` : ""}` : "Not yet"}
              </Field>
              <Field label="Back at base">
                {r.descentCheckedAt ? `Returned ${formatWAT(r.descentCheckedAt)}${r.descentCheckedBy ? ` — scanned by ${r.descentCheckedBy}` : ""}` : "Not yet"}
              </Field>
            </dl>
          </Section>

          {r.earlierPayment && (
            <Section title="Earlier payment">
              <p className="text-sm text-forest-900/70">
                Paid before registration became free. Kept for your records; any refund is made in the Paystack dashboard.
              </p>
              <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Amount paid">{formatNaira(r.earlierPayment.amountKobo)}</Field>
                <Field label="Paid">{formatWAT(r.earlierPayment.paidAt)}</Field>
                <Field label="Ticket bought">{r.earlierPayment.ticket}</Field>
                <Field label="Transaction"><span className="font-mono text-xs">{r.earlierPayment.transaction}</span></Field>
              </dl>
            </Section>
          )}
        </div>

        <aside className="space-y-4">
          <Section title="Actions">
            <div className="flex flex-col items-stretch gap-2 [&>*]:justify-start">
              {registered && perm.resend && actionButton("resend", "Resend pass (email + SMS)", Send, { variant: "forest" })}
              {registered && (
                <Button asChild size="sm" variant="outline">
                  <a href={`/admin/slips?id=${r.id}`} target="_blank" rel="noopener">
                    <Printer className="h-4 w-4" /> Print registration slip
                  </a>
                </Button>
              )}
              {r.status === "PENDING" && perm.edit && actionButton("confirm", "Confirm and issue pass", TicketCheck, { variant: "forest" })}
              {registered && perm.edit &&
                actionButton("regenerate_link", "Issue new pass link", Link2, {
                  confirm: "Issue a new pass link? The climber's current QR code — including any slip already printed — will stop working, and the new pass is emailed and texted to them. Use this if their pass was shared or leaked.",
                })}
              {r.status === "CANCELLED" && perm.cancel && actionButton("reinstate", "Reinstate registration", RotateCcw)}
              {r.status !== "CANCELLED" && perm.cancel && (
                <Button size="sm" variant="ghost" className="text-clay-600 hover:bg-clay-500/10" disabled={busy !== null} onClick={() => setAsking("cancel")}>
                  <Ban className="h-4 w-4" /> Cancel registration
                </Button>
              )}
              {!perm.resend && !perm.edit && !perm.cancel && <p className="text-sm text-forest-900/60">Your role can only view this registration.</p>}
            </div>
            {asking === "cancel" && (
              <ReasonForm
                title="Cancel this registration?"
                label="Reason (kept in the history)"
                cta="Cancel registration"
                danger
                onCancel={() => setAsking(null)}
                onSubmit={(reason) => act("cancel", { reason })}
              />
            )}
          </Section>

          <Section title="History">
            {history.length === 0 ? (
              <p className="text-sm text-forest-900/60">No staff actions yet.</p>
            ) : (
              <ol className="space-y-3 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex gap-2">
                    <History className="mt-0.5 h-4 w-4 shrink-0 text-forest-900/40" />
                    <span>
                      <span className="font-semibold text-forest-900">{h.action}</span>
                      <span className="block text-xs text-forest-900/60">{h.who} · {formatWAT(h.at)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </aside>
      </div>
    </main>
  );
}
