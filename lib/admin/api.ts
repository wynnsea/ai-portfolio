// Lapisan akses data admin. SEKARANG: data lokal (mock) di memori browser.
// NANTI (Laravel): ganti isi fungsi di bawah dengan fetch ke API, contoh:
//
//   const API = process.env.NEXT_PUBLIC_API_URL; // mis. http://localhost:8000/api
//   export async function list(resource) {
//     const res = await fetch(`${API}/${resource}`, { headers: authHeaders() });
//     return res.json();
//   }
//
// Spesifikasi lengkap API: docs/BACKEND-API-BRIEF.md. Ringkasan endpoint admin:
//   GET    /api/admin/{resource}      daftar data
//   POST   /api/admin/{resource}      tambah
//   GET    /api/admin/{resource}/{id}   detail
//   PUT    /api/admin/{resource}/{id}   ubah
//   DELETE /api/admin/{resource}/{id}   hapus
//   POST   /api/admin/login           login (Laravel Sanctum, kembalikan token)
import { seed, type Resource, type Row } from "@/lib/admin/data";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

/** Ambil data awal sebuah resource (mock). */
export function initialRows(resource: Resource): Row[] {
  return seed[resource].map((r) => ({ ...r }));
}

/** Simulasi simpan (create/update). Mengembalikan data yang tersimpan. */
export async function saveRow(resource: Resource, row: Row): Promise<Row> {
  await delay();
  return row;
}

/** Simulasi hapus. */
export async function deleteRow(resource: Resource, id: number): Promise<void> {
  void resource;
  void id;
  await delay();
}

/** Simulasi login. Nanti: POST /api/login ke Laravel Sanctum. */
export async function login(email: string, password: string): Promise<{ ok: boolean; message?: string }> {
  await delay(700);
  if (!email.includes("@") || password.length < 6) {
    return { ok: false, message: "Email atau password belum sesuai (password minimal 6 karakter)." };
  }
  return { ok: true };
}
