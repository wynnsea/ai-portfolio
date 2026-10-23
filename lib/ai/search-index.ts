import { projects } from "@/lib/projects";
import { posts } from "@/lib/posts";
import type { SearchItem } from "@/lib/ai/types";

/** Index ringan untuk pencarian ⌘K. Dibuat di server lalu dikirim ke client. */
export function buildSearchIndex(): SearchItem[] {
  return [
    ...projects.map<SearchItem>((p) => ({
      type: "Project",
      title: p.title,
      subtitle: p.summary,
      href: `/projects/${p.slug}`,
      keywords: [p.category, p.role, p.stack.join(" "), p.overview, p.titleJp].join(" "),
    })),
    ...posts.map<SearchItem>((p) => ({
      type: "Blog",
      title: p.title,
      subtitle: p.excerpt,
      href: `/blog/${p.slug}`,
      keywords: [p.category, p.titleJp, ...p.content.map((b) => ("text" in b ? b.text : ""))].join(" "),
    })),
    { type: "Section", title: "Tentang Saya", subtitle: "Cerita, pendidikan, pengalaman, dan keahlian", href: "/#about", keywords: "about me tentang profil skill keahlian pengalaman kerja pendidikan kuliah takumi" },
    { type: "Section", title: "Sertifikasi", subtitle: "JLPT N4, Junior Web Developer, TOEFL, iTEP", href: "/#certifications", keywords: "certifications sertifikat sertifikasi toefl itep jlpt n4 bahasa inggris jepang junior web developer bnsp" },
    { type: "Section", title: "Kegiatan", subtitle: "Program industri, fasilitator, dan kegiatan kampus", href: "/#activities", keywords: "activities kegiatan aktivitas organisasi fasilitator bunkasai panitia berbagi makrab hima nusantara data center academy microsoft learning factory minori" },
    { type: "Section", title: "Job Match", subtitle: "Cek kecocokan dengan lowongan kamu", href: "/#job-match", keywords: "recruiter lowongan hire rekrut cocok kandidat" },
    { type: "Section", title: "Kontak", subtitle: "Email, GitHub, dan LinkedIn", href: "/#contact", keywords: "contact kontak hubungi email github linkedin" },
  ];
}
