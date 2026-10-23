import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Bantuan" };

const faqs = [
  {
    q: "Kenapa data yang saya tambah hilang setelah refresh?",
    a: "Panel ini masih UI saja. Data disimpan sementara di memori browser sampai API Laravel tersambung.",
  },
  {
    q: "Bagaimana cara menyambungkan ke Laravel?",
    a: "Isi NEXT_PUBLIC_API_URL di .env.local (mis. http://localhost:8000/api), lalu ganti isi fungsi di lib/admin/api.ts dengan fetch ke endpoint di bawah.",
  },
  {
    q: "Login pakai apa?",
    a: "Rencananya Laravel Sanctum. Endpoint /api/admin/login mengembalikan token, lalu token dikirim sebagai header Authorization: Bearer di setiap request.",
  },
  {
    q: "Apakah halaman admin muncul di Google?",
    a: "Tidak. Semua halaman /admin diberi meta robots noindex, nofollow.",
  },
];

const endpoints = [
  ["POST", "/api/admin/login", "Login, kembalikan token"],
  ["POST", "/api/admin/logout", "Hapus token aktif"],
  ["GET", "/api/admin/{resource}", "Daftar data (search, filter, paginasi)"],
  ["POST", "/api/admin/{resource}", "Tambah data"],
  ["GET", "/api/admin/{resource}/{id}", "Detail data"],
  ["PUT", "/api/admin/{resource}/{id}", "Ubah data"],
  ["DELETE", "/api/admin/{resource}/{id}", "Hapus data"],
  ["GET", "/api/{resource}", "Data publik untuk website (hanya Terbit)"],
  ["POST", "/api/messages", "Kirim pesan dari form kontak"],
];

const methodTone: Record<string, string> = {
  GET: "bg-emerald-50 text-emerald-700",
  POST: "bg-ad-soft text-ad-deep",
  PUT: "bg-amber-50 text-amber-700",
  DELETE: "bg-rose-50 text-rose-600",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Bantuan" description="FAQ dan rencana endpoint API Laravel." />

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
          <h2 className="font-semibold">Rencana endpoint</h2>
          <p className="text-xs text-ad-muted">
            {"{resource}"}: projects, certifications, activities, posts, messages. Detail lengkap: docs/BACKEND-API-BRIEF.md
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <tbody>
              {endpoints.map(([method, path, desc]) => (
                <tr key={method + path} className="border-b border-white/60 last:border-0">
                  <td className="w-24 px-5 py-3">
                    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${methodTone[method]}`}>{method}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{path}</td>
                  <td className="px-5 py-3 text-ad-muted">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
