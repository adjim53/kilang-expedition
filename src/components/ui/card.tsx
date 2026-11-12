import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-sand-200 bg-white p-6 shadow-sm sm:p-8", className)}
      {...props}
    />
  );
}
