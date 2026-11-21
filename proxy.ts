import { NextResponse, type NextRequest } from "next/server";

/**
 * Panel admin di subdomain (mis. admin.wynnsea.my.id), terpisah dari domain utama.
 *
 * Halaman admin tetap ada di app/admin (path internal /admin/*). Proxy ini mengatur:
 * - Host yang diawali "admin." (admin.wynnsea.my.id, admin.localhost):
 *     /            → tampilkan /admin (dashboard)
 *     /proyek      → tampilkan /admin/proyek (URL tetap bersih)
 *     /admin/...   → dialihkan ke versi bersihnya (link lama tetap berfungsi)
 * - Domain utama: /admin/* dibalas 404, tapi HANYA kalau env ADMIN_HOST diisi
 *   (tanda subdomain admin sudah disiapkan), supaya tidak terkunci dari admin sebelum itu.
 *   Deployment preview (*.vercel.app) tidak diblokir, jadi admin tetap bisa dites di sana.
 */

const isAdminHost = (host: string) => host.startsWith("admin.");

function mainHosts(): string[] {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").hostname;
    return host ? [host, `www.${host.replace(/^www\./, "")}`] : [];
  } catch {
    return [];
  }
}

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;

  if (isAdminHost(host)) {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice("/admin".length) || "/";
      // Pakai host asli dari header (URL request bisa memakai host server, tanpa "admin.")
      const rawHost = request.headers.get("host");
      if (rawHost) url.host = rawHost;
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
    const res = NextResponse.rewrite(url);
    // robots.txt subdomain ini sama dengan situs utama, jadi larang indeks lewat header juga
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // Domain utama: sembunyikan panel admin setelah subdomain admin aktif
  if (process.env.ADMIN_HOST && mainHosts().includes(host) && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/_admin-tidak-tersedia"; // path yang tidak ada → halaman 404 situs
    return NextResponse.rewrite(url, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  // Lewati API, aset Next.js, dan file statis (logo, gambar, favicon) supaya tidak ikut di-rewrite
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
