/** Browser-safe pass ID helpers (no Node APIs). */

export const PASS_ID_PATTERN = /KIL-\d{4}-[A-Z0-9]{4}/i;

/** Pull a pass ID out of whatever a QR scanner returns (a URL or the bare ID). */
export function extractPassId(scanned: string): string | null {
  const match = scanned.match(PASS_ID_PATTERN);
  return match ? match[0].toUpperCase() : null;
}
