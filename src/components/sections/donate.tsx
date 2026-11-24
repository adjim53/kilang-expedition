import { HandHeart } from "lucide-react";
import { CONTACT } from "@/data/event";
import { Reveal } from "@/components/reveal";
import { Topo } from "@/components/topo";
import { DonateFlow } from "./donate-flow";

const USES = [
  "Medical team, first aid and the mandatory checkup",
  "Mountain guides, marshals and safety equipment",
  "Water, bibs and logistics for every climber",
];

export function Donate() {
  return (
    <section id="donate" className="section relative overflow-hidden bg-forest-800 text-white">
      <Topo className="text-white/[0.05]" />
      <div className="container relative grid gap-10 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-14">
        <Reveal>
          <p className="eyebrow text-amber-400">Support the expedition</p>
          <h2 className="section-title mt-3">The climb is free. Your gift keeps it that way.</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-forest-100">
            Nobody pays to register. The expedition is carried by well-wishers and partners who believe in
            recreation, unity and peace building in Kaltungo. Give any amount, as an individual or on behalf of
            an organisation.
          </p>
          <ul className="mt-7 space-y-3">
            {USES.map((use) => (
              <li key={use} className="flex items-start gap-3 text-forest-100">
                <HandHeart className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                {use}
              </li>
            ))}
          </ul>
          <p className="mt-7 max-w-xl text-sm leading-relaxed text-forest-200">
            Want to partner with the expedition, sponsor in kind, or give by bank transfer? Write to{" "}
            <a href={`mailto:${CONTACT.email}`} className="font-bold text-white underline underline-offset-4">
              {CONTACT.email}
            </a>{" "}
            or call {CONTACT.phones[0]}.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <DonateFlow />
        </Reveal>
      </div>
    </section>
  );
}
