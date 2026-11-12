import { getTiers } from "@/lib/tiers";
import { Reveal } from "@/components/reveal";
import { RegistrationFlow } from "./registration-flow";

export async function Register() {
  const tiers = await getTiers();

  return (
    <section id="register" className="section bg-sand-100">
      <div className="container">
        <Reveal>
          <p className="eyebrow text-clay-500">Registration &amp; tickets</p>
          <h2 className="section-title mt-3 text-forest-900">Claim your place on the trail.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-forest-900/70">
            Pick a ticket, tell us about yourself, and pay securely. Your digital pass with its QR code arrives
            by email and SMS the moment your payment is confirmed.
          </p>
        </Reveal>
        <div className="mt-10">
          <RegistrationFlow tiers={tiers} />
        </div>
      </div>
    </section>
  );
}
