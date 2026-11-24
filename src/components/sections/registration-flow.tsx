"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, QrCode, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BLOOD_GROUPS,
  EXPERIENCE_LABELS,
  EXPERIENCE_LEVELS,
  GENOTYPES,
  KIT_SIZES,
  registrationSchema,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import { z } from "zod";

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

type FieldErrors = Partial<Record<keyof FormState, string>>;
type Phase = "idle" | "saving" | "opening";

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

export function RegistrationFlow() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);

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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
      const next: FieldErrors = {};
      for (const [key, value] of Object.entries(flat)) if (value?.[0]) next[key as keyof FieldErrors] = value[0];
      setErrors(next);
      const first = Object.keys(next)[0];
      document.getElementById(first)?.focus();
      setMessage("Please fix the highlighted fields.");
      return;
    }

    setPhase("saving");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (res.ok && json.passUrl) {
        // Registered: the pass and QR code already exist. Show them.
        setPhase("opening");
        router.push(json.passUrl);
        return;
      }
      if (json.fieldErrors) {
        const next: FieldErrors = {};
        for (const [key, value] of Object.entries(json.fieldErrors as Record<string, string[]>))
          if (value?.[0]) next[key as keyof FieldErrors] = value[0];
        setErrors(next);
      }
      setMessage(json.error ?? "Something went wrong. Please try again.");
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
    }
    setPhase("idle");
  }

  return (
    <div>
      {/* ── Climber details ──────────────────────────────────────────── */}
      <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm sm:p-10">
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
            <p>{message}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 border-t border-sand-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-forest-900/70">Expedition registration</p>
            <p className="font-display text-3xl font-semibold text-forest-900">Free</p>
          </div>
          <div className="sm:text-right">
            <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
              {busy && <Loader2 className="h-5 w-5 animate-spin" />}
              {phase === "saving" && "Registering you…"}
              {phase === "opening" && "Opening your pass…"}
              {phase === "idle" && "Register & get my pass"}
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-forest-900/60 sm:justify-end">
              <QrCode className="h-3.5 w-3.5" /> Your QR pass and registration slip are issued instantly
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
