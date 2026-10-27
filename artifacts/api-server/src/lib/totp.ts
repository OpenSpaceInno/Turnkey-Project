import crypto from "crypto";
import QRCode from "qrcode";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generate a random Base32 secret for TOTP (default 32 characters = 160 bits)
 */
export function generateBase32Secret(length: number = 32): string {
  const bytes = crypto.randomBytes(length);
  let secret = "";
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[bytes[i]! % 32];
  }
  return secret;
}

/**
 * Decode Base32 string to Buffer
 */
export function base32ToBuffer(base32Str: string): Buffer {
  const cleanStr = base32Str.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let val = 0;
  const output: number[] = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i];
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((val >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/**
 * Generate TOTP 6-digit code for a given timestamp step (RFC 6238)
 */
export function generateTOTP(secret: string, stepOffset: number = 0, timestampMs: number = Date.now()): string {
  const timeStep = Math.floor(timestampMs / 1000 / 30) + stepOffset;
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  const secretBuffer = base32ToBuffer(secret);
  const hmac = crypto.createHmac("sha1", secretBuffer).update(timeBuffer).digest();

  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const code = (binary % 1000000).toString().padStart(6, "0");
  return code;
}

/**
 * Verify a 6-digit TOTP token with clock drift tolerance
 */
export function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  if (!secret || !token) return false;
  const cleanToken = token.toString().replace(/\D/g, "");
  if (cleanToken.length !== 6) return false;

  for (let offset = -window; offset <= window; offset++) {
    const expected = generateTOTP(secret, offset);
    if (cleanToken === expected) {
      return true;
    }
  }
  return false;
}

/**
 * Generate standard otpauth URL
 */
export function generateOtpAuthUrl(email: string, secret: string, issuer: string = "Kanak Turnkey"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate QR code data URL (PNG)
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  return await QRCode.toDataURL(otpAuthUrl, {
    margin: 2,
    width: 240,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Generate 8 human-readable backup recovery codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${randomHex.slice(0, 4)}-${randomHex.slice(4)}`);
  }
  return codes;
}
