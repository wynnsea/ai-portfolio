import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Bantuan" };

const faqs = [
  {
    q: "Data disimpan di mana?",
    a: "Di database Supabase (Postgres). Tabelnya: projects, certifications, activities, posts, messages, settings, dan page_views. Skemanya ada di supabase/migrations.",
  },
  {
    q: "Kenapa proyek atau artikel saya tidak muncul di website?",
    a: "Website hanya menampilkan proyek dan artikel berstatus Terbit. Draft dan Arsip hanya terlihat di panel ini.",
  },
  {
    q: "Login pakai apa?",
    a: "Supabase Auth (email & password). Akun harus terdaftar di tabel public.admins. Akun lain tetap bisa login ke Supabase, tapi semua perubahan data akan ditolak database.",
  },
  {
    q: "Bagaimana menambah admin baru?",
    a: "Buat user di Supabase Dashboard → Authentication → Users, lalu di SQL Editor: insert into public.admins (user_id) select id from auth.users where email = 'email@contoh.com';",
  },
  {
    q: "Bagaimana menulis subjudul atau daftar di artikel?",
    a: "Di kolom isi artikel: ## untuk subjudul, - untuk poin daftar, > untuk kutipan, dan ``` untuk blok kode. Pisahkan paragraf dengan baris kosong.",
  },
  {
    q: "Apakah halaman admin muncul di Google?",
    a: "Tidak. Semua halaman /admin diberi meta robots noindex, nofollow.",
  },
];

const access = [
  ["Pengunjung", "Proyek & artikel", "Baca yang berstatus Terbit"],
  ["Pengunjung", "Sertifikasi, kegiatan, pengaturan", "Baca semua"],
  ["Pengunjung", "page_views", "Catat kunjungan"],
  ["Admin", "Semua tabel", "Baca, tambah, ubah, hapus"],
  ["Admin", "Storage bucket media", "Unggah, ubah, hapus file"],
];

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Bantuan" description="FAQ dan aturan akses data di Supabase." />

      <section className="grid gap-3 md:grid-cols-2">
        {faqs.map((f) => (
          <details key={f.q} className="ad-glass-soft group rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-medium">
              {f.q}
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ad-soft text-ad-deep transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ad-muted">{f.a}</p>
          </details>
        ))}
      </section>

      <section className="ad-glass-soft overflow-hidden rounded-3xl">
        <div className="border-b border-white/80 px-5 py-4">
          <h2 className="font-semibold">Aturan akses (Row Level Security)</h2>
          <p className="text-xs text-ad-muted">Ditegakkan langsung oleh database, bukan oleh kode website.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <tbody>
              {access.map(([who, what, can]) => (
                <tr key={who + what} className="border-b border-white/60 last:border-0">
                  <td className="w-32 px-5 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${who === "Admin" ? "bg-ad-soft text-ad-deep" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      {who}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{what}</td>
                  <td className="px-5 py-3 text-ad-muted">{can}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
