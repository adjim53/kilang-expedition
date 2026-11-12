import QRCode from "qrcode";
import { appUrl } from "./utils";

const QR_OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  width: 480,
  color: { dark: "#0A2B29", light: "#FFFFFF" },
};

/** The QR encodes the pass URL; marshals' scanners read the pass ID out of it. */
export function passUrl(passId: string, accessToken: string) {
  return `${appUrl()}/pass/${passId}?t=${accessToken}`;
}

export function qrPngBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, { ...QR_OPTIONS, type: "png" });
}

export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { ...QR_OPTIONS, type: "svg" });
}
