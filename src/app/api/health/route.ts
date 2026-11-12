import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paystackConfigured, paystackMode } from "@/lib/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe for the host and the deploy workflow.
 * Reports only whether each integration is configured — never any secret.
 */
export async function GET() {
  let database = false;
  try {
    await prisma.ticketTier.count();
    database = true;
  } catch (err) {
    console.error("[health] database check failed", err);
  }

  const body = {
    ok: database,
    database,
    integrations: {
      paystack: paystackConfigured() ? paystackMode() : "not_configured",
      resend: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
      termii: Boolean(process.env.TERMII_API_KEY && process.env.TERMII_SENDER_ID),
    },
  };

  return NextResponse.json(body, {
    status: database ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
