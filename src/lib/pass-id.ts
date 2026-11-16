/** Browser-safe pass ID helpers (no Node APIs). */

export const PASS_ID_PATTERN = /KIL-\d{4}-[A-Z0-9]{4}/i;

/** Pull a pass ID out of whatever a QR scanner returns (a URL or the bare ID). */
export function extractPassId(scanned: string): string | null {
  const match = scanned.match(PASS_ID_PATTERN);
  return match ? match[0].toUpperCase() : null;
}

export type ScannedPass = { passId: string | null; token: string | null };

/**
 * Read a scanned QR. Genuine passes encode the full pass URL
 * (…/pass/KIL-2026-XXXX?t=secret); a bare pass ID typed or scanned carries no token.
 */
export function parseScannedPass(scanned: string): ScannedPass {
  const text = scanned.trim();
  const passId = extractPassId(text);
  let token: string | null = null;
  try {
    const url = new URL(text);
    if (/\/pass\//i.test(url.pathname)) token = url.searchParams.get("t");
  } catch {
    // not a URL — bare pass ID
  }
  return { passId, token: token && /^[A-Za-z0-9_-]{16,100}$/.test(token) ? token : null };
}
