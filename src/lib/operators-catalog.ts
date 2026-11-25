import type { Operator } from "./types";

function getServerApiBaseUrl(): string {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");
}

function getServerApiHeaders(): HeadersInit {
  const apiKey =
    process.env.API_SECRET_KEY || "kalsite-dev-api-secret-change-in-production";
  return {
    "x-api-key": apiKey,
  };
}

export async function fetchPublicOperators(): Promise<Operator[]> {
  const apiUrl = getServerApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/operators`, {
      headers: getServerApiHeaders(),
      cache: "no-store",
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
  const apiUrl = getServerApiBaseUrl();
  try {
    const res = await fetch(`${apiUrl}/operators/${encodeURIComponent(slug)}`, {
      headers: getServerApiHeaders(),
      cache: "no-store",
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
