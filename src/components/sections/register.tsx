import { Reveal } from "@/components/reveal";
import { RegistrationFlow } from "./registration-flow";

export function Register() {
  return (
    <section id="register" className="section bg-sand-100">
      <div className="container">
        <Reveal>
          <p className="eyebrow text-clay-500">Registration</p>
          <h2 className="section-title mt-3 text-forest-900">Claim your place on the trail.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-forest-900/70">
            Registration is free. Tell us about yourself and your digital pass with its QR code is issued on the
            spot — on screen to print as your registration slip, and by email and SMS.
          </p>
        </Reveal>
        <div className="mt-10">
          <RegistrationFlow />
        </div>
      </div>
    </section>
  );
}
