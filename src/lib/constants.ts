export const SYSTEM_NAME = process.env.NEXT_PUBLIC_SYSTEM_NAME || "ZOOT";

const PUBLIC_API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export function resolveAssetUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) {
    return `${PUBLIC_API_URL}${url}`;
  }
  return url;
}

export const OPERATOR_CLASSES = [
  "Vanguard",
  "Guard",
  "Defender",
  "Sniper",
  "Caster",
  "Medic",
  "Supporter",
  "Specialist",
] as const;
