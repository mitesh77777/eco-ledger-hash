const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function joinUrl(base: string, path: string) {
  if (!base) return path;
  if (!path) return base;
  // If base already ends with /api and path starts with /api/, avoid duplicating
  if (base.endsWith("/api") && path.startsWith("/api/")) return base + path.slice(4);
  if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
  return base + path;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

import { session } from "@/services/auth";

export class ApiError<T = any> extends Error {
  status: number;
  data?: T;
  constructor(status: number, message: string, data?: T) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, method: HttpMethod = "GET", body?: any): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = session.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = joinUrl(API_URL, path);
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    let data: any = undefined;
    try { data = await res.json(); msg = data?.error || data?.message || msg; } catch {}
    throw new ApiError(res.status, msg, data);
  }
  return res.json();
}

export const api = {
  // RECs
  listRECs: () => request<any[]>("/api/recs"),
  mintREC: (payload: { energySource: string; location: string; mwh: number; price: number; generationDate: string; ownerId?: string }) =>
    request<{ success: boolean; rec: any; tokenId: string; transactionId: string }>("/api/recs/mint", "POST", payload),
  purchaseREC: (id: string, buyerId: string) =>
    request<{ success: boolean; transactionId: string; message: string }>(`/api/recs/${id}/purchase`, "POST", { buyerId }),
  retireREC: (id: string) => request<{ success: boolean; message: string }>(`/api/recs/${id}/retire`, "POST"),

  // Energy
  currentEnergy: () => request<{ currentOutput: number; efficiency: number; weatherCondition: string }>("/api/energy/current"),

  // Portfolio
  portfolio: () => request<{ recs: any[]; stats: { totalRECs: number; totalMWh: number; totalSpent: number; carbonOffset: number } }>("/api/portfolio"),
};
