"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A print button that can also open the print dialog by itself once the page
 * (QR codes and logo included) has finished loading.
 */
export function PrintButton({ auto = false, label = "Print" }: { auto?: boolean; label?: string }) {
  useEffect(() => {
    if (!auto) return;
    let timer: ReturnType<typeof setTimeout>;
    const go = () => {
      timer = setTimeout(() => window.print(), 400);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", go);
    };
  }, [auto]);

  return (
    <Button variant="forest" onClick={() => window.print()}>
      <Printer className="h-5 w-5" /> {label}
    </Button>
  );
}
