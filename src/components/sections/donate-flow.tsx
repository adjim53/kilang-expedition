"use client";

import { useState } from "react";
import { CircleCheck, Loader2, Lock, TriangleAlert } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  DONATION_PRESETS_KOBO,
  DONOR_TYPE_LABELS,
  DONOR_TYPES,
  type DonorType,
} from "@/data/donations";
import { donationSchema } from "@/lib/validation";
import { cn, formatNaira } from "@/lib/utils";

type FormState = {
  amountNaira: string;
  donorType: DonorType;
  donorName: string;
  organisation: string;
  email: string;
  phone: string;
  message: string;
};

const EMPTY: FormState = {
  amountNaira: String(DONATION_PRESETS_KOBO[1] / 100),
  donorType: "INDIVIDUAL",
  donorName: "",
  organisation: "",
  email: "",
  phone: "",
  message: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;
type Phase = "idle" | "saving" | "paying" | "verifying";
type Receipt = { reference: string; amountKobo: number; receiptSent: boolean };

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

export function DonateFlow() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const busy = phase !== "idle";
  const amountKobo = Math.round(Number(form.amountNaira.replace(/[,\s]/g, "")) * 100);
  const amountValid = Number.isFinite(amountKobo) && amountKobo > 0;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function inputProps(key: keyof FormState) {
    const id = `donate-${key}`;
    return {
      id,
      name: key,
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `${id}-error` : undefined,
      disabled: busy,
    };
  }

  /** Ask the server whether Paystack really received the money, then show the thank-you. */
  async function finish(url: string, init?: RequestInit) {
    setPhase("verifying");
    setMessage(null);
    try {
      const res = await fetch(url, init);
      const json = await res.json();
      if (res.ok && json.received) {
        setReceipt({ reference: json.reference, amountKobo: json.amountKobo, receiptSent: Boolean(json.receiptSent) });
        setPendingReference(null);
        setForm(EMPTY);
        setPhase("idle");
        return;
      }
      setMessage(json.error ?? "We couldn't confirm your donation yet. Tap “Check my donation” in a moment.");
    } catch {
      setMessage(
        "Your payment went through, but the connection dropped before we could confirm it. Tap “Check my donation” — you will not be charged again.",
      );
    }
    setPhase("idle");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setPendingReference(null);

    const parsed = donationSchema.safeParse({ ...form, amountNaira: form.amountNaira.replace(/[,\s]/g, "") });
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
      const next: FieldErrors = {};
      for (const [key, value] of Object.entries(flat)) if (value?.[0]) next[key as keyof FieldErrors] = value[0];
      setErrors(next);
      document.getElementById(`donate-${Object.keys(next)[0]}`)?.focus();
      setMessage("Please fix the highlighted fields.");
      return;
    }

    setPhase("saving");
    let checkout: { reference: string; email: string; amountKobo: number; mode: "paystack" | "demo"; publicKey: string | null };
    try {
      const res = await fetch("/api/donations", {
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
          setMessage("Donation cancelled — nothing was charged. Your details are still here if you change your mind.");
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

  if (receipt) {
    return (
      <div className="rounded-2xl bg-white p-6 text-forest-900 shadow-lift sm:p-9" role="status">
        <CircleCheck className="h-12 w-12 text-forest-600" />
        <h3 className="mt-4 text-3xl font-semibold">Thank you.</h3>
        <p className="mt-2 text-lg leading-relaxed text-forest-900/80">
          Your donation of <strong>{formatNaira(receipt.amountKobo)}</strong> has been received.
        </p>
        <dl className="mt-5 rounded-xl bg-sand-50 p-4 text-sm">
          <dt className="text-xs font-bold uppercase tracking-wider text-forest-900/50">Reference</dt>
          <dd className="mt-0.5 font-mono font-bold">{receipt.reference}</dd>
        </dl>
        <p className="mt-4 text-sm text-forest-900/70">
          {receipt.receiptSent
            ? "A receipt is on its way to your email."
            : "Keep this reference as your record of the donation."}
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setReceipt(null)}>
          Give again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl bg-white p-6 text-forest-900 shadow-lift sm:p-9">
      <h3 className="text-3xl font-semibold">Make a donation</h3>

      <fieldset disabled={busy} className="mt-6">
        <legend className="field-label">Amount</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {DONATION_PRESETS_KOBO.map((kobo) => {
            const selected = amountKobo === kobo;
            return (
              <button
                key={kobo}
                type="button"
                aria-pressed={selected}
                onClick={() => set("amountNaira", String(kobo / 100))}
                className={cn(
                  "h-12 rounded-xl border-2 px-2 text-sm font-bold transition",
                  selected
                    ? "border-forest-700 bg-forest-700 text-white"
                    : "border-sand-300 bg-white text-forest-900 hover:border-forest-700",
                )}
              >
                {formatNaira(kobo)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field id="donate-amountNaira" label="Or enter another amount (₦)" error={errors.amountNaira} className="mt-4">
        <input
          {...inputProps("amountNaira")}
          inputMode="numeric"
          className="field-input"
          placeholder="10,000"
          value={form.amountNaira}
          onChange={(e) => set("amountNaira", e.target.value.replace(/[^\d,]/g, ""))}
        />
      </Field>

      <fieldset disabled={busy} className="mt-6">
        <legend className="field-label">I am giving as</legend>
        <div className="grid grid-cols-2 gap-2">
          {DONOR_TYPES.map((type) => (
            <label
              key={type}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-3 text-center text-sm font-bold transition",
                form.donorType === type
                  ? "border-forest-700 bg-forest-700 text-white"
                  : "border-sand-300 bg-white hover:border-forest-700",
              )}
            >
              <input
                type="radio"
                name="donorType"
                value={type}
                checked={form.donorType === type}
                onChange={() => set("donorType", type)}
                className="sr-only"
              />
              {DONOR_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {form.donorType === "PARTNER" && (
          <Field id="donate-organisation" label="Organisation" error={errors.organisation} className="sm:col-span-2">
            <input
              {...inputProps("organisation")}
              className="field-input"
              autoComplete="organization"
              value={form.organisation}
              onChange={(e) => set("organisation", e.target.value)}
            />
          </Field>
        )}
        <Field
          id="donate-donorName"
          label={form.donorType === "PARTNER" ? "Contact person" : "Your name"}
          error={errors.donorName}
          className="sm:col-span-2"
        >
          <input
            {...inputProps("donorName")}
            className="field-input"
            autoComplete="name"
            value={form.donorName}
            onChange={(e) => set("donorName", e.target.value)}
          />
        </Field>
        <Field id="donate-email" label="Email" error={errors.email} hint="Your receipt is sent here.">
          <input
            {...inputProps("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            className="field-input"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field id="donate-phone" label="Phone (optional)" error={errors.phone}>
          <input
            {...inputProps("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="field-input"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field id="donate-message" label="Message to the organisers (optional)" error={errors.message} className="sm:col-span-2">
          <textarea
            {...inputProps("message")}
            rows={2}
            className="field-input"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
          />
        </Field>
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
                onClick={() => void finish(`/api/payments/verify?reference=${encodeURIComponent(pendingReference)}`)}
              >
                Check my donation
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-7 border-t border-sand-200 pt-6">
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy && <Loader2 className="h-5 w-5 animate-spin" />}
          {phase === "saving" && "Preparing…"}
          {phase === "paying" && "Waiting for payment…"}
          {phase === "verifying" && "Confirming your donation…"}
          {phase === "idle" && (amountValid ? `Donate ${formatNaira(amountKobo)}` : "Donate")}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-forest-900/60">
          <Lock className="h-3.5 w-3.5" /> Secure payment in naira by Paystack
        </p>
      </div>
    </form>
  );
}
