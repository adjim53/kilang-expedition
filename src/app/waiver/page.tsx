import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, EVENT } from "@/data/event";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Safety waiver" };

/**
 * DRAFT WAIVER — written as a sensible starting point, not legal advice.
 * Have a Nigerian lawyer review and adapt this text before taking registrations.
 */
const CLAUSES = [
  {
    title: "1. Voluntary participation",
    body: "I am taking part in the Kilang Mountain Expedition 2026 of my own free will. I understand that the expedition involves hiking on steep, rocky and uneven mountain terrain, starting before dawn in darkness and cold.",
  },
  {
    title: "2. Understanding the risks",
    body: "I understand that mountain hiking carries real risks, including slips and falls, sprains and fractures, dehydration, exhaustion, heat or cold stress, insect and animal encounters, and — rarely — serious injury or death. I accept these risks.",
  },
  {
    title: "3. Medical fitness",
    body: "I confirm that the medical information I have given is true and complete. I will attend the mandatory medical checkup on December 30, 2026, and I accept that the medical team may refuse me clearance to climb. I understand that no clearance means no climb, and that this decision is final.",
  },
  {
    title: "4. Conduct on the mountain",
    body: "I will follow the instructions of guides, marshals and the medical team at all times, stay with my group, carry the required gear, and tell a marshal immediately if I or anyone near me is unwell. I will respect the mountain, its sacred sites and the host community, and I will leave no litter.",
  },
  {
    title: "5. Emergency treatment",
    body: "If I am injured or become ill, I consent to first aid and emergency medical treatment, and to being evacuated if the medical team judges it necessary. I agree that my next of kin may be contacted using the details I have provided.",
  },
  {
    title: "6. Release",
    body: "To the fullest extent permitted by law, I release the organisers, volunteers, guides, sponsors and host community of the Kilang Mountain Expedition from liability for loss, injury or damage arising from my participation, except where caused by their gross negligence or wilful misconduct.",
  },
  {
    title: "7. Photos and video",
    body: "I understand that the expedition will be photographed and filmed, and I agree that images in which I appear may be used by the organisers to document and promote the expedition.",
  },
  {
    title: "8. My information",
    body: "I agree that my personal and medical details may be used by the organisers and the expedition medical team for registration, safety and emergency purposes only.",
  },
];

export default function WaiverPage() {
  return (
    <>
      <SiteHeader solid />
      <main className="bg-sand-50 pb-20 pt-28">
        <article className="container max-w-3xl">
          <p className="eyebrow text-clay-500">{EVENT.name}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-forest-900 sm:text-5xl">
            Safety waiver &amp; participant agreement
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-forest-900/70">
            Every climber accepts this agreement when registering. Please read it carefully.
          </p>

          <div className="mt-10 space-y-8">
            {CLAUSES.map((c) => (
              <section key={c.title}>
                <h2 className="text-2xl font-semibold text-forest-900">{c.title}</h2>
                <p className="mt-2 text-base leading-relaxed text-forest-900/80">{c.body}</p>
              </section>
            ))}
          </div>

          <p className="mt-10 rounded-2xl border-l-4 border-amber-500 bg-white p-5 text-sm leading-relaxed text-forest-900/80">
            Questions about this agreement? Contact the organisers at{" "}
            <a href={`mailto:${CONTACT.email}`} className="font-bold text-forest-700 underline underline-offset-4">
              {CONTACT.email}
            </a>{" "}
            or {CONTACT.phones.join(", ")}.
          </p>

          <p className="mt-8">
            <Link href="/#register" className="font-bold text-forest-700 underline underline-offset-4">
              ← Back to registration
            </Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
