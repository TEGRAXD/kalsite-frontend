import type { Operator } from "./types";

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

export async function fetchPublicOperators(): Promise<Operator[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/operators`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Operator[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchPublicOperatorBySlug(
  slug: string,
): Promise<Operator | undefined> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/operators/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: Operator };
      if (json.data) return json.data;
    }
  } catch {
    // Backend unavailable
  }
  return undefined;
}
