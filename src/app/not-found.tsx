import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Topo } from "@/components/topo";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-forest-900 px-6 text-center text-white">
      <Topo className="text-white/[0.06]" />
      <div className="relative">
        <p className="eyebrow text-amber-400">Off the trail</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight">This page isn&apos;t on the map.</h1>
        <p className="mx-auto mt-4 max-w-md text-forest-100">
          If you were opening your expedition pass, use the full link from your confirmation email.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Back to base camp</Link>
        </Button>
      </div>
    </main>
  );
}
