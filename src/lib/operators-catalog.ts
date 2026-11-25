import { cookies } from "next/headers";
import type { Operator, User } from "./types";

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

export async function fetchIsServerAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    if (!sessionId) return false;

    const apiUrl = getServerApiBaseUrl();
    const res = await fetch(`${apiUrl}/me`, {
      headers: {
        Cookie: `session_id=${encodeURIComponent(sessionId)}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { data?: { user?: User } };
    const roleId = json.data?.user?.roleId;
    return roleId === "administrator" || roleId === "super-administrator";
  } catch {
    return false;
  }
}

export async function fetchPublicOperators(options?: {
  includeDisabled?: boolean;
}): Promise<Operator[]> {
  const apiUrl = getServerApiBaseUrl();
  const qs = options?.includeDisabled ? "?includeDisabled=true" : "";
  try {
    const res = await fetch(`${apiUrl}/operators${qs}`, {
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
  options?: { includeDisabled?: boolean },
): Promise<Operator | undefined> {
  const apiUrl = getServerApiBaseUrl();
  const qs = options?.includeDisabled ? "?includeDisabled=true" : "";
  try {
    const res = await fetch(
      `${apiUrl}/operators/${encodeURIComponent(slug)}${qs}`,
      {
        headers: getServerApiHeaders(),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = (await res.json()) as { data?: Operator };
      if (json.data) return json.data;
    }
  } catch {
    // Backend unavailable
  }
  return undefined;
}
