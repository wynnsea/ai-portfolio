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
    { type: "Section", title: "About Me", subtitle: "Cerita, pendidikan, pengalaman, dan skill", href: "/#about", keywords: "tentang profil skill pengalaman kerja pendidikan kuliah takumi" },
    { type: "Section", title: "Certifications", subtitle: "JLPT N4, Junior Web Developer, TOEFL, iTEP", href: "/#certifications", keywords: "sertifikat sertifikasi toefl itep jlpt n4 bahasa inggris jepang junior web developer bnsp" },
    { type: "Section", title: "Activities", subtitle: "Program industri, fasilitator, dan kegiatan kampus", href: "/#activities", keywords: "kegiatan aktivitas organisasi fasilitator bunkasai panitia berbagi makrab hima nusantara data center academy microsoft learning factory minori" },
    { type: "Section", title: "Job Match", subtitle: "Cek kecocokan dengan lowongan kamu", href: "/#job-match", keywords: "recruiter lowongan hire rekrut cocok kandidat" },
    { type: "Section", title: "Contact", subtitle: "Email, GitHub, dan LinkedIn", href: "/#contact", keywords: "kontak hubungi email github linkedin" },
  ];
}
