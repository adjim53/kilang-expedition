import { prisma } from "@/lib/prisma";
import { passUrl, qrPngBuffer } from "@/lib/qr";

export const runtime = "nodejs";

/** PNG of a participant's pass QR. Requires the pass's secret token. */
export async function GET(request: Request, { params }: { params: Promise<{ passId: string }> }) {
  const { passId } = await params;
  const token = new URL(request.url).searchParams.get("t");

  const registration = await prisma.registration.findUnique({ where: { passId: passId.toUpperCase() } });
  if (!registration || !registration.passId || !token || token !== registration.accessToken) {
    return new Response("Not found", { status: 404 });
  }

  const png = await qrPngBuffer(passUrl(registration.passId, registration.accessToken));
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${registration.passId}-qr.png"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
