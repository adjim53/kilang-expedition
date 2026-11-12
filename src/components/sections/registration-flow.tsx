"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Lock, TriangleAlert } from "lucide-react";
import type { Tier } from "@/data/tiers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BLOOD_GROUPS,
  EXPERIENCE_LABELS,
  EXPERIENCE_LEVELS,
  GENOTYPES,
  KIT_SIZES,
  registrationSchema,
} from "@/lib/validation";
import { cn, formatNaira } from "@/lib/utils";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  bloodGroup: string;
  genotype: string;
  experience: string;
  medicalNotes: string;
  kitSize: string;
  waiverAccepted: boolean;
};

const EMPTY: FormState = {
  fullName: "",
  email: "",
  phone: "",
  nextOfKinName: "",
  nextOfKinPhone: "",
  bloodGroup: "",
  genotype: "",
  experience: "",
  medicalNotes: "",
  kitSize: "",
  waiverAccepted: false,
};

type FieldErrors = Partial<Record<keyof FormState | "tierId", string>>;
type Phase = "idle" | "saving" | "paying" | "verifying";

type PaystackPopup = {
  newTransaction(options: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    reference: string;
    onSuccess: () => void;
    onCancel: () => void;
    onError?: (error: { message?: string }) => void;
  }): void;
};

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopup;
  }
}

function loadPaystack(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Paystack"));
    document.body.appendChild(script);
  });
}

function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-forest-900/60">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function RegistrationFlow({ tiers }: { tiers: Tier[] }) {
  const router = useRouter();
  const [tierId, setTierId] = useState(tiers.find((t) => t.featured)?.id ?? tiers[0]?.id ?? "");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(null);

  const tier = tiers.find((t) => t.id === tierId);
  const busy = phase !== "idle";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function inputProps(key: keyof FormState) {
    return {
      id: key,
      name: key,
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `${key}-error` : undefined,
      disabled: busy,
    };
  }

  async function finish(url: string, init?: RequestInit) {
    setPhase("verifying");
    setMessage(null);
    try {
      const res = await fetch(url, init);
      const json = await res.json();
      if (res.ok && json.passUrl) {
        router.push(json.passUrl);
        return;
      }
      setMessage(
        json.error ??
          "We received your payment but couldn't load your pass yet. It will also arrive by email and SMS.",
      );
    } catch {
      setMessage(
        "Your payment went through, but the connection dropped before we could show your pass. Tap “Check my payment” — you will not be charged again.",
      );
    }
    setPhase("idle");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setPendingReference(null);

    const parsed = registrationSchema.safeParse({ ...form, tierId });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const next: FieldErrors = {};
      for (const [key, value] of Object.entries(flat)) if (value?.[0]) next[key as keyof FieldErrors] = value[0];
      setErrors(next);
      const first = Object.keys(next)[0];
      document.getElementById(first)?.focus();
      setMessage("Please fix the highlighted fields.");
      return;
    }

    setPhase("saving");
    let checkout: {
      reference: string;
      email: string;
      amountKobo: number;
      mode: "paystack" | "demo";
      publicKey: string | null;
    };
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.fieldErrors) {
          const next: FieldErrors = {};
          for (const [key, value] of Object.entries(json.fieldErrors as Record<string, string[]>))
            if (value?.[0]) next[key as keyof FieldErrors] = value[0];
          setErrors(next);
        }
        setMessage(json.error ?? "Something went wrong. Please try again.");
        setPhase("idle");
        return;
      }
      checkout = json;
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
      setPhase("idle");
      return;
    }

    setPendingReference(checkout.reference);

    // Local development without Paystack keys: simulate the payment.
    if (checkout.mode === "demo") {
      await finish("/api/payments/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: checkout.reference }),
      });
      return;
    }

    try {
      await loadPaystack();
      setPhase("paying");
      new window.PaystackPop!().newTransaction({
        key: checkout.publicKey ?? "",
        email: checkout.email,
        amount: checkout.amountKobo,
        currency: "NGN",
        reference: checkout.reference,
        onSuccess: () => {
          void finish(`/api/payments/verify?reference=${encodeURIComponent(checkout.reference)}`);
        },
        onCancel: () => {
          setPhase("idle");
          setPendingReference(null);
          setMessage("Payment cancelled. Your details are still here — pay when you're ready.");
        },
        onError: (error) => {
          setPhase("idle");
          setMessage(error?.message ?? "Paystack couldn't start the payment. Please try again.");
        },
      });
    } catch {
      setPhase("idle");
      setMessage("We couldn't load the payment window. Check your connection and try again.");
    }
  }

  return (
    <div>
      {/* ── Ticket tiers ─────────────────────────────────────────────── */}
      <fieldset disabled={busy}>
        <legend className="sr-only">Choose your ticket</legend>
        <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map((t) => {
            const selected = t.id === tierId;
            return (
              <label
                key={t.id}
                className={cn(
                  "relative flex cursor-pointer flex-col rounded-2xl border-2 bg-white p-6 transition sm:p-7",
                  selected
                    ? "border-forest-700 shadow-lift"
                    : "border-sand-200 hover:border-forest-300",
                )}
              >
                <input
                  type="radio"
                  name="tierId"
                  value={t.id}
                  checked={selected}
                  onChange={() => setTierId(t.id)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-semibold leading-tight text-forest-900">{t.name}</h3>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                      selected ? "border-forest-700 bg-forest-700 text-white" : "border-sand-300",
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" strokeWidth={4} />}
                  </span>
                </div>
                {t.featured && (
                  <Badge variant="gold" className="mt-2 self-start">
                    Most popular
                  </Badge>
                )}
                <p className="mt-2 text-sm text-forest-900/70">{t.tagline}</p>
                <p className="mt-5 font-display text-4xl font-semibold text-forest-700">
                  {formatNaira(t.priceKobo)}
                </p>
                <ul className="mt-5 space-y-2 border-t border-sand-200 pt-5 text-sm text-forest-900/85">
                  {t.perks.map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={3} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </label>
            );
          })}
        </div>
        {errors.tierId && <p className="field-error">{errors.tierId}</p>}
      </fieldset>

      {/* ── Climber details ──────────────────────────────────────────── */}
      <form onSubmit={onSubmit} noValidate className="mt-8 rounded-2xl border border-sand-200 bg-white p-6 shadow-sm sm:p-10">
        <h3 className="text-3xl font-semibold text-forest-900">Climber details</h3>
        <p className="mt-2 text-sm text-forest-900/70">
          One registration per climber. Your pass is sent to this email and phone number.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Field id="fullName" label="Full name" error={errors.fullName} className="sm:col-span-2">
            <input
              {...inputProps("fullName")}
              className="field-input"
              autoComplete="name"
              placeholder="As it should appear on your pass"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </Field>

          <Field id="email" label="Email" error={errors.email}>
            <input
              {...inputProps("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              className="field-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>

          <Field id="phone" label="Phone (WhatsApp enabled)" error={errors.phone}>
            <input
              {...inputProps("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="field-input"
              placeholder="0803 190 7825"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>

          <Field id="nextOfKinName" label="Next of kin — name" error={errors.nextOfKinName}>
            <input
              {...inputProps("nextOfKinName")}
              className="field-input"
              placeholder="Who should we call in an emergency?"
              value={form.nextOfKinName}
              onChange={(e) => set("nextOfKinName", e.target.value)}
            />
          </Field>

          <Field id="nextOfKinPhone" label="Next of kin — phone" error={errors.nextOfKinPhone}>
            <input
              {...inputProps("nextOfKinPhone")}
              type="tel"
              inputMode="tel"
              className="field-input"
              placeholder="0813 657 1113"
              value={form.nextOfKinPhone}
              onChange={(e) => set("nextOfKinPhone", e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-9 rounded-2xl bg-sand-50 p-5 sm:p-6">
          <h4 className="font-display text-xl font-semibold text-forest-900">Medical information</h4>
          <p className="mt-1 text-sm text-forest-900/70">
            Used only by the expedition medical team for your clearance and in an emergency.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field id="bloodGroup" label="Blood group" error={errors.bloodGroup}>
              <select
                {...inputProps("bloodGroup")}
                className="field-input"
                value={form.bloodGroup}
                onChange={(e) => set("bloodGroup", e.target.value)}
              >
                <option value="">Select…</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>

            <Field id="genotype" label="Genotype" error={errors.genotype}>
              <select
                {...inputProps("genotype")}
                className="field-input"
                value={form.genotype}
                onChange={(e) => set("genotype", e.target.value)}
              >
                <option value="">Select…</option>
                {GENOTYPES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>

            <Field
              id="medicalNotes"
              label="Emergency medical notes / allergies"
              error={errors.medicalNotes}
              hint="Asthma, heart conditions, allergies, medication you carry. Leave blank if none."
              className="sm:col-span-2"
            >
              <textarea
                {...inputProps("medicalNotes")}
                rows={3}
                className="field-input"
                value={form.medicalNotes}
                onChange={(e) => set("medicalNotes", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Field id="experience" label="Prior hiking experience" error={errors.experience}>
            <select
              {...inputProps("experience")}
              className="field-input"
              value={form.experience}
              onChange={(e) => set("experience", e.target.value)}
            >
              <option value="">Select…</option>
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {EXPERIENCE_LABELS[level]}
                </option>
              ))}
            </select>
          </Field>

          <Field id="kitSize" label="T-shirt / kit size" error={errors.kitSize}>
            <div role="radiogroup" aria-label="T-shirt / kit size" className="flex flex-wrap gap-2">
              {KIT_SIZES.map((size, i) => (
                <button
                  key={size}
                  id={i === 0 ? "kitSize" : undefined}
                  type="button"
                  role="radio"
                  aria-checked={form.kitSize === size}
                  disabled={busy}
                  onClick={() => set("kitSize", size)}
                  className={cn(
                    "h-12 min-w-[3.25rem] rounded-xl border-2 px-3 text-base font-bold transition",
                    form.kitSize === size
                      ? "border-forest-700 bg-forest-700 text-white"
                      : "border-sand-300 bg-white text-forest-900 hover:border-forest-700",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-8">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              id="waiverAccepted"
              type="checkbox"
              checked={form.waiverAccepted}
              disabled={busy}
              onChange={(e) => set("waiverAccepted", e.target.checked)}
              aria-invalid={Boolean(errors.waiverAccepted)}
              className="mt-1 h-5 w-5 shrink-0 rounded border-sand-300 accent-forest-700"
            />
            <span className="text-[15px] leading-relaxed text-forest-900/85">
              I have read and accept the{" "}
              <Link href="/waiver" target="_blank" className="font-bold text-forest-700 underline underline-offset-4">
                safety waiver
              </Link>
              , I will attend the mandatory medical checkup on December 30, and the information above is true.
            </span>
          </label>
          {errors.waiverAccepted && <p className="field-error">{errors.waiverAccepted}</p>}
        </div>

        {message && (
          <div role="alert" className="mt-6 flex gap-3 rounded-xl bg-clay-500/10 p-4 text-sm font-medium text-clay-600">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>{message}</p>
              {pendingReference && phase === "idle" && (
                <button
                  type="button"
                  className="mt-2 font-bold underline underline-offset-4"
                  onClick={() =>
                    void finish(`/api/payments/verify?reference=${encodeURIComponent(pendingReference)}`)
                  }
                >
                  Check my payment
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 border-t border-sand-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-forest-900/70">{tier?.name ?? "Choose a ticket"}</p>
            <p className="font-display text-3xl font-semibold text-forest-900">
              {tier ? formatNaira(tier.priceKobo) : "—"}
            </p>
          </div>
          <div className="sm:text-right">
            <Button type="submit" size="lg" disabled={busy || !tier} className="w-full sm:w-auto">
              {busy && <Loader2 className="h-5 w-5 animate-spin" />}
              {phase === "saving" && "Saving your details…"}
              {phase === "paying" && "Waiting for payment…"}
              {phase === "verifying" && "Confirming payment…"}
              {phase === "idle" && "Pay & get my pass"}
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-forest-900/60 sm:justify-end">
              <Lock className="h-3.5 w-3.5" /> Secure payment in naira by Paystack
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
