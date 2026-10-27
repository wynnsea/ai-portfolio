// Akses data panel admin lewat Supabase (menggantikan API Laravel).
// Nama fungsi dan bentuk hasil sama dengan versi sebelumnya, jadi komponen admin tidak perlu diubah.
// Hak akses ditegakkan oleh RLS: hanya user yang terdaftar di tabel public.admins yang bisa menulis.
import type { PostgrestError } from "@supabase/supabase-js";
import type { Resource, Row } from "@/lib/admin/data";
import { blocksToText, readTimeOf, slugify, textToBlocks } from "@/lib/admin/content";
import type { PostBlock } from "@/lib/posts";
import type { SiteSettings } from "@/lib/public-api";
import { getAdminClient, setRememberSession } from "@/lib/supabase/client";

export type { SiteSettings } from "@/lib/public-api";

const db = () => getAdminClient();

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

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

function notifyDashboardRefresh(): void {
  window.dispatchEvent(new Event("admin:dashboard-refresh"));
}

/** Terjemahkan error Supabase menjadi ApiError yang dimengerti form admin. */
function toApiError(error: PostgrestError, status: number): ApiError {
  // Token kedaluwarsa / tidak ada sesi / bukan admin
  if (status === 401 || error.code === "PGRST301" || error.code === "42501") {
    window.dispatchEvent(new Event("admin:unauthorized"));
    return new ApiError("Sesi berakhir atau akun tidak punya akses admin. Silakan login lagi.", 401);
  }
  if (error.code === "23505") {
    return new ApiError("Judul ini sudah dipakai data lain.", 422, { title: ["Judul ini sudah dipakai, coba judul lain."] });
  }
  if (error.code === "23514" || error.code === "22P02") {
    return new ApiError("Ada isian yang formatnya tidak valid.", 422);
  }
  return new ApiError(error.message, status || 500);
}

function check<T>(result: { data: T | null; error: PostgrestError | null; status: number }): T {
  if (result.error) throw toApiError(result.error, result.status);
  return result.data as T;
}

// ---------------------------------------------------------------------------
// Konfigurasi per menu CRUD
// ---------------------------------------------------------------------------

type ResourceConfig = {
  table: string;
  /** Kolom yang dicari saat admin mengetik di kotak pencarian. */
  search: string[];
  /** Field form yang boleh disimpan (whitelist), dalam camelCase. */
  fields: string[];
  /** Field yang disimpan sebagai null kalau dikosongkan. */
  nullable?: string[];
  /** Butuh slug untuk URL publik. */
  slug?: boolean;
};

const resources: Record<Resource, ResourceConfig> = {
  proyek: {
    table: "projects",
    search: ["title", "category", "role"],
    fields: [
      "title", "titleJp", "kanji", "tone", "category", "year", "role", "duration", "status", "stack",
      "coverUrl", "summary", "overview", "challenge", "approach", "results", "demoUrl", "sourceUrl",
    ],
    slug: true,
  },
  sertifikasi: {
    table: "certifications",
    search: ["title", "issuer", "category"],
    fields: ["title", "titleJp", "kanji", "tone", "issuer", "category", "year", "score", "note", "coverUrl", "credentialUrl"],
    nullable: ["year", "score", "note", "coverUrl", "credentialUrl"],
  },
  kegiatan: {
    table: "activities",
    search: ["title", "role", "organizer"],
    fields: ["title", "titleJp", "kanji", "tone", "category", "role", "organizer", "year", "description", "photos", "focus"],
    nullable: ["year"],
  },
  artikel: {
    table: "posts",
    search: ["title", "category", "excerpt"],
    fields: ["title", "titleJp", "kanji", "tone", "category", "date", "status", "coverUrl", "excerpt", "content"],
    slug: true,
  },
  pesan: {
    table: "messages",
    search: ["name", "email", "subject"],
    fields: ["status"],
  },
};

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Baris database → baris tabel/form admin. */
function toRow(record: Record<string, unknown>): Row {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) row[toCamel(key)] = value;
  if (Array.isArray(row.stack)) row.stack = row.stack.join(", ");
  if (Array.isArray(row.approach)) row.approach = row.approach.join("\n");
  if (Array.isArray(row.results)) {
    row.results = (row.results as { value?: string; label?: string }[])
      .map((result) => [result.value ?? "", result.label ?? ""].filter(Boolean).join(" | "))
      .join("\n");
  }
  if (Array.isArray(row.photos)) row.photos = row.photos.join("\n");
  if (row.links && typeof row.links === "object") {
    const links = row.links as Record<string, unknown>;
    row.demoUrl = typeof links.demo === "string" ? links.demo : "";
    row.sourceUrl = typeof links.source === "string" ? links.source : "";
  }
  if (Array.isArray(row.content)) row.content = blocksToText(row.content as PostBlock[]);
  // Pesan tidak punya kolom tanggal sendiri: pakai waktu masuknya
  if (row.date === undefined && typeof row.createdAt === "string") row.date = row.createdAt.slice(0, 10);
  return row as Row;
}

/** Isian form admin → kolom database (hanya field yang diizinkan). */
function toRecord(config: ResourceConfig, payload: Record<string, unknown>): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (!(field in payload)) continue;
    let value = payload[field];
    if (typeof value === "string") value = value.trim();

    if (field === "stack" && typeof value === "string") {
      value = value.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (field === "approach" && typeof value === "string") {
      value = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    } else if (field === "results" && typeof value === "string") {
      value = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [result, ...label] = line.split("|");
          return { value: result.trim(), label: label.join("|").trim() };
        });
    } else if (field === "photos" && typeof value === "string") {
      value = value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    } else if (field === "content" && typeof value === "string") {
      record.read_time = readTimeOf(value);
      value = textToBlocks(value);
    } else if (field === "date" && value === "") {
      continue; // biarkan default database (hari ini)
    } else if (value === "" && config.nullable?.includes(field)) {
      value = null;
    }

    if (field === "demoUrl" || field === "sourceUrl") {
      const links = (record.links as Record<string, string> | undefined) ?? {};
      if (typeof value === "string" && value) links[field === "demoUrl" ? "demo" : "source"] = value;
      record.links = links;
    } else {
      const column = field === "coverUrl" ? "cover_url" : toSnake(field);
      record[column] = value;
    }
  }
  if (config.table === "projects" && "links" in record && Object.keys(record.links as object).length === 0) {
    record.links = {};
  }
  return record;
}

/** Cari slug yang belum dipakai: judul → judul-2 → judul-3 ... */
async function uniqueSlug(table: string, title: string): Promise<string> {
  const base = slugify(title);
  const rows = check(await db().from(table).select("slug").like("slug", `${base}%`)) as { slug: string }[];
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

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
  const config = resources[resource];
  const from = (params.page - 1) * params.perPage;

  let query = db()
    .from(config.table)
    .select("*", { count: "exact" })
    .order("id", { ascending: false })
    .range(from, from + params.perPage - 1);

  // Karakter ini punya arti khusus di filter PostgREST, jadi dibuang dari kata kunci
  const search = params.search.trim().replace(/[,()"\\%]/g, " ").trim();
  if (search) query = query.or(config.search.map((column) => `${column}.ilike."%${search}%"`).join(","));

  if (params.filterKey && params.filterValue && params.filterValue !== "Semua") {
    query = query.eq(toSnake(params.filterKey), params.filterValue);
  }

  const result = await query;
  const data = check(result) as Record<string, unknown>[];
  const total = result.count ?? data.length;

  return {
    rows: data.map(toRow),
    total,
    currentPage: params.page,
    lastPage: Math.max(1, Math.ceil(total / params.perPage)),
  };
}

export async function getRow(resource: Resource, id: number): Promise<Row> {
  const { table } = resources[resource];
  let record = check(await db().from(table).select("*").eq("id", id).single()) as Record<string, unknown>;

  // Pesan otomatis ditandai sebagai 'Dibaca' saat dibuka / di-view
  if (resource === "pesan" && record.status === "Baru") {
    record = check(await db().from(table).update({ status: "Dibaca" }).eq("id", id).select().single()) as Record<string, unknown>;
    notifyDashboardRefresh();
  }

  return toRow(record);
}

export async function saveRow(resource: Resource, payload: Record<string, unknown>, id?: number): Promise<Row> {
  const config = resources[resource];
  const record = toRecord(config, payload);

  let saved: Record<string, unknown>;
  if (id === undefined) {
    if (config.slug) record.slug = await uniqueSlug(config.table, String(payload.title ?? ""));
    saved = check(await db().from(config.table).insert(record).select().single()) as Record<string, unknown>;
  } else {
    // Slug tidak diubah saat edit supaya link yang sudah dibagikan tetap jalan
    saved = check(await db().from(config.table).update(record).eq("id", id).select().single()) as Record<string, unknown>;
  }

  if (resource === "pesan") notifyDashboardRefresh();
  return toRow(saved);
}

export async function deleteRow(resource: Resource, id: number): Promise<void> {
  const { table } = resources[resource];
  const deleted = check(await db().from(table).delete().eq("id", id).select("id")) as { id: number }[];
  // RLS tidak melempar error kalau tidak berhak: hasilnya hanya 0 baris
  if (!deleted.length) throw new ApiError("Data tidak ditemukan atau kamu tidak punya akses.", 404);
  if (resource === "pesan") notifyDashboardRefresh();
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

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

async function count(table: string, filter?: [string, string]): Promise<number> {
  let query = db().from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter[0], filter[1]);
  const result = await query;
  check(result);
  return result.count ?? 0;
}

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Tanggal hari ini di WIB, format YYYY-MM-DD. */
const todayInJakarta = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Pengunjung Senin–Minggu minggu ini. Hari yang belum lewat diisi rata-rata sebagai perkiraan. */
async function weeklyVisitors(): Promise<DashboardData["weeklyVisitors"]> {
  const today = todayInJakarta();
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Senin = 0
  const monday = addDays(today, -weekday);

  const rows = check(await db().rpc("daily_visits", { since: monday })) as { day: string; visits: number }[];
  const visits = new Map(rows.map((r) => [r.day, Number(r.visits)]));

  const days = DAY_LABELS.map((label, i) => {
    const date = addDays(monday, i);
    return { day: label, value: visits.get(date) ?? 0, future: date > today };
  });

  const past = days.filter((d) => !d.future);
  const average = Math.round(past.reduce((sum, d) => sum + d.value, 0) / Math.max(1, past.length));
  return days.map((d) => (d.future ? { ...d, value: average } : d));
}

type LatestItem = { title: string; year?: string | null; date?: string; created_at: string };

export async function getDashboard(): Promise<DashboardData> {
  const [
    projects,
    certifications,
    activities,
    posts,
    messages,
    unreadMessages,
    publishedProjects,
    publishedPosts,
    latestMessages,
    latestProjects,
    latestCertifications,
    latestActivities,
    latestPosts,
    settings,
    visitors,
  ] = await Promise.all([
    count("projects"),
    count("certifications"),
    count("activities"),
    count("posts"),
    count("messages"),
    count("messages", ["status", "Baru"]),
    count("projects", ["status", "Terbit"]),
    count("posts", ["status", "Terbit"]),
    db().from("messages").select("id, name, subject, status, created_at").order("created_at", { ascending: false }).limit(5),
    db().from("projects").select("title, year, created_at").order("created_at", { ascending: false }).limit(5),
    db().from("certifications").select("title, year, created_at").order("created_at", { ascending: false }).limit(5),
    db().from("activities").select("title, year, created_at").order("created_at", { ascending: false }).limit(5),
    db().from("posts").select("title, date, created_at").order("created_at", { ascending: false }).limit(5),
    db().from("settings").select("description, photo_url, cv_url, socials").eq("id", 1).single(),
    weeklyVisitors(),
  ]);

  const content = [
    ...(check(latestProjects) as LatestItem[]).map((r) => ({ ...r, type: "project" })),
    ...(check(latestCertifications) as LatestItem[]).map((r) => ({ ...r, type: "certification" })),
    ...(check(latestActivities) as LatestItem[]).map((r) => ({ ...r, type: "activity" })),
    ...(check(latestPosts) as LatestItem[]).map((r) => ({ ...r, type: "post" })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5)
    .map((r) => ({ type: r.type, title: r.title, year: r.year ?? r.date?.slice(0, 4) ?? null }));

  const profile = check(settings) as { description: string; photo_url: string | null; cv_url: string | null; socials: unknown[] };

  return {
    counts: { projects, certifications, activities, posts, messages, unreadMessages },
    latestMessages: (check(latestMessages) as { id: number; name: string; subject: string; status: string; created_at: string }[]).map((m) => ({
      id: m.id,
      name: m.name,
      subject: m.subject,
      status: m.status,
      date: m.created_at.slice(0, 10),
    })),
    latestContent: content,
    profileCompleteness: {
      checks: [
        { label: "Foto profil", done: Boolean(profile.photo_url) },
        { label: "Deskripsi diri", done: profile.description.trim().length >= 40 },
        { label: "File CV", done: Boolean(profile.cv_url) },
        { label: "Tautan media sosial", done: profile.socials.length > 0 },
        { label: "Minimal 1 proyek terbit", done: publishedProjects > 0 },
        { label: "Minimal 1 artikel terbit", done: publishedPosts > 0 },
      ],
    },
    weeklyVisitors: visitors,
  };
}

// ---------------------------------------------------------------------------
// Pengaturan & upload
// ---------------------------------------------------------------------------

type SettingsRecord = {
  brand: string;
  name: string;
  name_jp: string | null;
  role: string;
  description: string;
  location: string;
  email: string;
  photo_url: string | null;
  cv_url: string | null;
  availability: SiteSettings["availability"];
  socials: SiteSettings["socials"];
  features: SiteSettings["features"];
};

const settingsFromRecord = (r: SettingsRecord): SiteSettings => ({
  brand: r.brand,
  name: r.name,
  nameJp: r.name_jp,
  role: r.role,
  description: r.description,
  location: r.location,
  email: r.email,
  photoUrl: r.photo_url,
  cvUrl: r.cv_url,
  availability: r.availability,
  socials: r.socials ?? [],
  features: r.features,
});

const SETTINGS_COLUMNS: Record<keyof SiteSettings, keyof SettingsRecord> = {
  brand: "brand",
  name: "name",
  nameJp: "name_jp",
  role: "role",
  description: "description",
  location: "location",
  email: "email",
  photoUrl: "photo_url",
  cvUrl: "cv_url",
  availability: "availability",
  socials: "socials",
  features: "features",
};

export async function getSettings(): Promise<SiteSettings> {
  return settingsFromRecord(check(await db().from("settings").select("*").eq("id", 1).single()) as SettingsRecord);
}

export async function updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    const column = SETTINGS_COLUMNS[key as keyof SiteSettings];
    if (column) record[column] = value;
  }
  const saved = check(await db().from("settings").update(record).eq("id", 1).select().single()) as SettingsRecord;
  return settingsFromRecord(saved);
}

export async function uploadFile(file: File, folder: string): Promise<{ url: string; path: string }> {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const storage = db().storage.from("media");

  const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new ApiError(`Gagal mengunggah file: ${error.message}`, 400);

  return { url: storage.getPublicUrl(path).data.publicUrl, path };
}

// ---------------------------------------------------------------------------
// Autentikasi (Supabase Auth)
// ---------------------------------------------------------------------------

async function isAdmin(): Promise<boolean> {
  const { data, error } = await db().rpc("is_admin");
  return !error && data === true;
}

export async function login(email: string, password: string, remember: boolean): Promise<{ ok: boolean; message?: string }> {
  setRememberSession(remember);
  const { error } = await db().auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: error.code === "invalid_credentials" ? "Email atau password salah." : error.message };
  }

  if (!(await isAdmin())) {
    await db().auth.signOut();
    return { ok: false, message: "Akun ini tidak punya akses ke panel admin." };
  }
  return { ok: true };
}

export async function logout(): Promise<void> {
  await db().auth.signOut();
}

export async function getMe(): Promise<{ id: string; name: string; email: string; photoUrl?: string | null }> {
  const { data, error } = await db().auth.getUser();
  if (error || !data.user) throw new ApiError("Belum login.", 401);
  if (!(await isAdmin())) throw new ApiError("Akun ini tidak punya akses ke panel admin.", 403);

  const email = data.user.email ?? "";
  const name = typeof data.user.user_metadata?.name === "string" ? data.user.user_metadata.name : email.split("@")[0];
  return { id: data.user.id, name, email };
}

export async function updatePassword(currentPassword: string, password: string, passwordConfirmation: string): Promise<void> {
  if (password.length < 8) throw new ApiError("Password baru minimal 8 karakter.", 422);
  if (password !== passwordConfirmation) throw new ApiError("Konfirmasi password tidak sama.", 422);

  const { data } = await db().auth.getUser();
  const email = data.user?.email;
  if (!email) throw new ApiError("Belum login.", 401);

  // Pastikan password lama benar sebelum diganti
  const { error: wrong } = await db().auth.signInWithPassword({ email, password: currentPassword });
  if (wrong) throw new ApiError("Password saat ini salah.", 422);

  const { error } = await db().auth.updateUser({ password });
  if (error) throw new ApiError(error.message, 422);
}
