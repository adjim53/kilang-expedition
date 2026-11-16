import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApi } from "@/lib/admin-auth";
import { verifyScan } from "@/lib/pass-verify";

export const runtime = "nodejs";

const schema = z.object({ code: z.string().min(1).max(500) });

/** Validate a scanned pass QR (or a typed pass ID) and return the climber with a verdict. */
export async function POST(request: Request) {
  const guard = await requireApi(request, "checkin");
  if (guard.error) return guard.error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nothing scanned." }, { status: 400 });

  return NextResponse.json(await verifyScan(parsed.data.code));
}
