"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PassActions({ qrDownloadUrl, passId }: { qrDownloadUrl: string; passId: string }) {
  return (
    <div className="no-print mt-5 grid grid-cols-2 gap-3">
      <Button variant="forest" onClick={() => window.print()}>
        <Printer className="h-5 w-5" /> Print / save PDF
      </Button>
      <Button asChild variant="outline">
        <a href={qrDownloadUrl} download={`${passId}-qr.png`}>
          <Download className="h-5 w-5" /> Save QR code
        </a>
      </Button>
    </div>
  );
}
