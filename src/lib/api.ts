import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export function getErrorMessage(error: unknown, fallback = "Request failed") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Array<{ field?: string; message?: string }> }
      | undefined;
    if (data?.errors && data.errors.length > 0) {
      return data.errors.map((e) => e.message).join(", ");
    }
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export default api;
