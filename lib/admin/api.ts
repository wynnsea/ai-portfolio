import type { Resource, Row } from "@/lib/admin/data";
import type { SiteSettings } from "@/lib/public-api";

export type { SiteSettings } from "@/lib/public-api";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

const resourceEndpoints: Record<Resource, string> = {
  proyek: "projects",
  sertifikasi: "certifications",
  kegiatan: "activities",
  artikel: "posts",
  pesan: "messages",
};

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  errors: Record<string, string[]>;
  status: number;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  authenticated?: boolean;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("admin-token") ?? window.sessionStorage.getItem("admin-token");
}

function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("admin-token");
  window.sessionStorage.removeItem("admin-token");
}

function notifyDashboardRefresh(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("admin:dashboard-refresh"));
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError("NEXT_PUBLIC_API_URL belum dikonfigurasi.", 0);
  }

  const headers = new Headers({ Accept: "application/json" });
  const token = options.authenticated === false ? null : getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
    cache: "no-store",
  });

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload & T;
  if (!response.ok) {
    if (response.status === 401 && options.authenticated !== false) {
      clearToken();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("admin:unauthorized"));
    }
    throw new ApiError(
      payload.message ?? `Permintaan gagal (${response.status}).`,
      response.status,
      payload.errors ?? {},
    );
  }

  return payload;
}

function normalizeRow(value: Record<string, unknown>): Row {
  const row = { ...value };
  if (Array.isArray(row.stack)) row.stack = row.stack.join(", ");
  if (Array.isArray(row.content)) {
    row.content = row.content
      .map((block) => {
        if (!block || typeof block !== "object") return "";
        const item = block as { type?: string; text?: string; items?: string[]; code?: string };
        if (item.type === "list") return (item.items ?? []).join("\n");
        return item.text ?? item.code ?? "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return row as Row;
}

export type ListParams = {
  page: number;
  perPage: number;
  search: string;
  filterKey?: string;
  filterValue?: string;
};

export type ListResult = {
  rows: Row[];
  total: number;
  currentPage: number;
  lastPage: number;
};

export async function listRows(resource: Resource, params: ListParams): Promise<ListResult> {
  const search = new URLSearchParams({
    page: String(params.page),
    perPage: String(params.perPage),
  });
  if (params.search.trim()) search.set("search", params.search.trim());
  if (params.filterKey && params.filterValue && params.filterValue !== "Semua") {
    search.set(params.filterKey, params.filterValue);
  }

  const result = await request<{
    data: Record<string, unknown>[];
    meta?: { total?: number; current_page?: number; last_page?: number };
  }>(`/admin/${resourceEndpoints[resource]}?${search.toString()}`);

  return {
    rows: result.data.map(normalizeRow),
    total: result.meta?.total ?? result.data.length,
    currentPage: result.meta?.current_page ?? params.page,
    lastPage: result.meta?.last_page ?? 1,
  };
}

export async function getRow(resource: Resource, id: number): Promise<Row> {
  const result = await request<{ data: Record<string, unknown> }>(`/admin/${resourceEndpoints[resource]}/${id}`);
  if (resource === "pesan") notifyDashboardRefresh();
  return normalizeRow(result.data);
}

export async function saveRow(resource: Resource, row: Record<string, unknown>, id?: number): Promise<Row> {
  const endpoint = `/admin/${resourceEndpoints[resource]}`;
  const method = id === undefined ? "POST" : resource === "pesan" ? "PATCH" : "PUT";
  const path = id === undefined ? endpoint : `${endpoint}/${id}`;
  const result = await request<{ data: Record<string, unknown> }>(path, { method, body: row });
  if (resource === "pesan") notifyDashboardRefresh();
  return normalizeRow(result.data);
}

export async function deleteRow(resource: Resource, id: number): Promise<void> {
  await request<void>(`/admin/${resourceEndpoints[resource]}/${id}`, { method: "DELETE" });
  if (resource === "pesan") notifyDashboardRefresh();
}

export type DashboardData = {
  counts: {
    projects: number;
    certifications: number;
    activities: number;
    posts: number;
    messages: number;
    unreadMessages: number;
  };
  latestMessages: { id: number; name: string; subject: string; status: string; date: string }[];
  latestContent: { type: string; title: string; year: string | null }[];
  profileCompleteness: { checks: { label: string; done: boolean }[] };
  weeklyVisitors: { day: string; value: number; future: boolean }[];
};

export async function getDashboard(): Promise<DashboardData> {
  const result = await request<{ data: DashboardData }>("/admin/dashboard");
  return result.data;
}

export async function getSettings(): Promise<SiteSettings> {
  const result = await request<{ data: SiteSettings }>("/admin/settings");
  return result.data;
}

export async function updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const result = await request<{ data: SiteSettings }>("/admin/settings", { method: "PUT", body: settings });
  return result.data;
}

export async function uploadFile(file: File, folder: string): Promise<{ url: string; path: string }> {
  const body = new FormData();
  body.set("file", file);
  body.set("folder", folder);
  return request<{ url: string; path: string }>("/admin/uploads", { method: "POST", body });
}

export async function updatePassword(currentPassword: string, password: string, passwordConfirmation: string): Promise<void> {
  await request<void>("/admin/password", {
    method: "PUT",
    body: { currentPassword, password, passwordConfirmation },
  });
}

export async function getMe(): Promise<{ id: number; name: string; email: string; photoUrl?: string | null }> {
  const result = await request<{ data: { id: number; name: string; email: string; photoUrl?: string | null } }>("/admin/me");
  return result.data;
}

export async function logout(): Promise<void> {
  try {
    await request<void>("/admin/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

export async function login(
  email: string,
  password: string,
  remember: boolean,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const result = await request<{ token: string }>("/admin/login", {
      method: "POST",
      authenticated: false,
      body: { email, password, remember },
    });
    clearToken();
    const storage = remember ? window.localStorage : window.sessionStorage;
    storage.setItem("admin-token", result.token);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Login gagal. Silakan coba lagi.",
    };
  }
}
