import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
  {
    variants: {
      variant: {
        gold: "bg-amber-500 text-ink",
        forest: "bg-forest-700 text-white",
        soft: "bg-forest-100 text-forest-800",
        sand: "bg-sand-200 text-forest-900",
        warn: "bg-clay-500/15 text-clay-600",
      },
    },
    defaultVariants: { variant: "soft" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
