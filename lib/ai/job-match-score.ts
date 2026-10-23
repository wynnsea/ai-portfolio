import { skillProfile, type SkillLevel } from "@/lib/ai/skill-profile";
import type { Extraction } from "@/lib/ai/job-match";
import { JobMatchResult } from "./types";
import type { Project } from "../projects";
import { projects as defaultProjects } from "../projects";
import { site } from "../site";

type Requirement = Extraction["requirements"][number];

const BOBOT = { wajib: 3, plus: 1 };
const NILAI: Record<SkillLevel, number> = { solid: 1, dasar: 0.5, belum: 0 };

export type ScoreResult = {
  score: number;
  lowConfidence: boolean;
  outOfField: boolean;
  seniorityNote?: string;
  matched: { label: string; level: SkillLevel; evidence: string[] }[];
  missing: string[];
};

export function scoreJob(ex: Extraction): ScoreResult {
  // (0) Syarat di luar bidang Wayan tidak dinilai dan tidak masuk daftar gap.
  //     Syarat yang cocok ke skill di profil selalu dianggap relevan.
  const relevan = ex.requirements.filter((r) => r.relevan || r.skillId !== "lainnya");
  const outOfField = relevan.length < ex.requirements.length / 2;

  // (1) Satu skill dihitung sekali saja (pertahanan lapis 3).
  //     Kalau muncul dua kali, yang "wajib" yang dipakai.
  const perSkill = new Map<string, Requirement>();
  const lainnya: Requirement[] = [];

  for (const req of relevan) {
    if (req.skillId === "lainnya") {
      lainnya.push(req);
      continue;
    }
    const sebelumnya = perSkill.get(req.skillId);
    if (!sebelumnya || req.importance === "wajib") perSkill.set(req.skillId, req);
  }

  // (2) Hitung poin
  let total = 0;
  let didapat = 0;
  const matched: ScoreResult["matched"] = [];
  const missing: string[] = [];

  for (const [skillId, req] of perSkill) {
    const skill = skillProfile.find((s) => s.id === skillId);
    if (!skill) continue;

    total += BOBOT[req.importance];
    didapat += BOBOT[req.importance] * NILAI[skill.level];

    if (skill.level === "belum") missing.push(skill.label);
    else matched.push({ label: skill.label, level: skill.level, evidence: skill.evidence });
  }

  for (const req of lainnya) {
    total += BOBOT[req.importance];
    missing.push(req.text);
  }

  let score = total > 0 ? (didapat / total) * 100 : 0;

  // (3) Penalti senioritas
  let seniorityNote: string | undefined;
  const tahun = ex.minYears ?? 0;

  if (ex.seniority === "senior" || ex.seniority === "lead" || tahun >= 5) {
    score *= 0.6;
    seniorityNote = "Posisi ini kayaknya terlalu senior buat level Wayan sekarang.";
  } else if (ex.seniority === "mid" || tahun >= 3) {
    score *= 0.85;
    seniorityNote = "Posisi ini minta pengalaman sedikit di atas level Wayan sekarang.";
  }

  return {
    score: Math.round(score),
    lowConfidence: perSkill.size + lainnya.length < 3,
    outOfField,
    seniorityNote,
    matched,
    missing,
  };
}

/** Ubah hasil skoring menjadi format yang dibaca UI. */
export function buildJobMatchResult(
  ex: Extraction,
  s: ScoreResult,
  projectList: Project[] = defaultProjects,
  name: string = site.name,
): JobMatchResult {
  // Kumpulkan project bukti dari semua skill yang cocok, tanpa duplikat
  const slugs = [...new Set(s.matched.flatMap((m) => m.evidence))];

  const projects = slugs.slice(0, 3).flatMap((slug) => {
    const p = projectList.find((project) => project.slug === slug);
    if (!p) return [];
    const lewat = s.matched.filter((m) => m.evidence.includes(slug)).map((m) => m.label);
    return [{ slug, title: p.title, reason: `Bukti: ${lewat.join(", ")}` }];
  });

  const totalSyarat = s.matched.length + s.missing.length;
  const verdict = s.score >= 80 ? "Cocok banget" : s.score >= 60 ? "Cukup cocok" : "Ada beberapa gap";
  const gap = s.missing.length
    ? ` Yang masih perlu dikejar: ${s.missing.slice(0, 3).join(", ")}${s.missing.length > 3 ? ", dan lainnya" : ""}.`
    : "";

  // Pilihan B: kalau datanya terlalu sedikit, skor tidak dikirim dan ringkasan tidak memberi penilaian,
  // supaya skor palsu (misalnya dari prompt injection) tidak bocor lewat angka maupun teks.
  const summary = s.outOfField
    ? `Posisi ${ex.position || "ini"} kayaknya di luar bidang ${name} (AI dan pengembangan perangkat lunak), jadi gak dinilai pakai skor.`
    : s.lowConfidence
      ? `Syarat yang kebaca dari lowongan ini terlalu sedikit buat dinilai akurat. Coba tempel deskripsi lowongan yang lebih lengkap ya.`
      : `${verdict} buat posisi ${ex.position || "ini"}. ${name} memenuhi ${s.matched.length} dari ${totalSyarat} syarat yang kebaca.${gap}`;

  // Lowongan yang tidak dinilai (beda bidang / kurang data) hanya dapat pesan:
  // tanpa skor, tanpa skill cocok, tanpa gap, tanpa project bukti.
  const dinilai = !s.outOfField && !s.lowConfidence;

  return {
    score: dinilai ? s.score : 0,
    summary,
    matched: dinilai ? s.matched.map((m) => m.label) : [],
    missing: dinilai ? s.missing : [],
    outOfField: s.outOfField,
    projects: dinilai ? projects : [],
    source: "ai",
    lowConfidence: s.lowConfidence,
    seniorityNote: s.seniorityNote,
  };
}
