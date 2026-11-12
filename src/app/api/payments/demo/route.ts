import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { confirmRegistration } from "@/lib/confirm";
import { demoPaymentsEnabled } from "@/lib/paystack";

export const runtime = "nodejs";

/**
 * DEVELOPMENT ONLY. Simulates a successful payment so the full flow can be
 * tested without Paystack keys. Returns 404 in production or once keys are set.
 */
export async function POST(request: Request) {
  if (!demoPaymentsEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { reference } = (await request.json().catch(() => ({}))) as { reference?: string };
  if (!reference) return NextResponse.json({ error: "Missing reference." }, { status: 400 });

  const registration = await prisma.registration.findUnique({ where: { reference } });
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 });

  const result = await confirmRegistration(reference, {
    transactionId: `demo-${Date.now()}`,
    amountKobo: registration.amountKobo,
  });
  if (!result.ok) return NextResponse.json({ error: "Could not confirm." }, { status: 500 });

  return NextResponse.json({ passId: result.passId, passUrl: `/pass/${result.passId}?t=${result.accessToken}` });
}
