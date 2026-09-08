import QRCode from "qrcode";

// Encodes a URL/token as a scannable QR code data URL — used for the
// visitor pass shown at the guard house / front office ahead of badge
// check-in, and verifiable at the public /verify/[token] page.
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 240 });
}
