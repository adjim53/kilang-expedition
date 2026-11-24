"use client";

import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PassActions({
  qrDownloadUrl,
  slipUrl,
  passId,
}: {
  qrDownloadUrl: string;
  slipUrl: string;
  passId: string;
}) {
  return (
    <div className="no-print mt-5 grid grid-cols-2 gap-3">
      <Button asChild variant="forest">
        <Link href={slipUrl} prefetch={false}>
          <Printer className="h-5 w-5" /> Print slip
        </Link>
      </Button>
      <Button asChild variant="outline">
        <a href={qrDownloadUrl} download={`${passId}-qr.png`}>
          <Download className="h-5 w-5" /> Save QR code
        </a>
      </Button>
    </div>
  );
}
