import type { NextConfig } from "next";

const securityHeaders = [
  // Nobody may show this site inside a frame (clickjacking on the admin portal).
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera only for this site's QR scanner; nothing else needs device access.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(self \"https://checkout.paystack.com\")" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const privatePage = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: privatePage },
      { source: "/api/admin/:path*", headers: privatePage },
      // Pass URLs carry the secret token: never send them as a referrer, never cache them.
      { source: "/pass/:path*", headers: [...privatePage, { key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

export default nextConfig;
