// Membuat supabase/seed.sql dari data statis di lib/*.ts.
// Jalankan: npx tsx scripts/generate-seed.ts
import { writeFileSync } from "node:fs";
import { projects } from "@/lib/projects";
import { certifications } from "@/lib/certifications";
import { activities } from "@/lib/activities";
import { posts } from "@/lib/posts";
import { site } from "@/lib/site";

/** Penanda nilai yang harus disimpan sebagai jsonb (array string biasa disimpan sebagai text[]). */
class Json {
  constructor(readonly value: unknown) {}
}
const json = (value: unknown) => new Json(value);

type Value = string | number | boolean | null | undefined | string[] | Json;

/** Ubah nilai JS menjadi literal SQL yang aman (tanda kutip di-escape). */
function sql(value: Value): string {
  if (value === null || value === undefined) return "null";
  if (value instanceof Json) return `${sql(JSON.stringify(value.value))}::jsonb`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
  return value.length ? `array[${value.map(sql).join(", ")}]::text[]` : "'{}'::text[]";
}

function insert(table: string, rows: Record<string, Value>[]): string {
  if (!rows.length) return `-- ${table}: tidak ada data\n`;
  const columns = Object.keys(rows[0]);
  const values = rows.map((row) => `  (${columns.map((c) => sql(row[c])).join(", ")})`).join(",\n");
  return `insert into public.${table} (${columns.join(", ")}) values\n${values};\n`;
}

const output = [
  "-- Dibuat otomatis oleh scripts/generate-seed.ts dari lib/*.ts. Jangan diedit manual.",
  "-- Jalankan SETELAH supabase/migrations/*_init.sql.",
  "",
  insert(
    "projects",
    projects.map((p) => ({
      slug: p.slug,
      title: p.title,
      title_jp: p.titleJp,
      kanji: p.kanji,
      tone: p.tone,
      category: p.category,
      year: p.year,
      role: p.role,
      duration: p.duration,
      summary: p.summary,
      overview: p.overview,
      challenge: p.challenge,
      approach: json(p.approach),
      results: json(p.results),
      stack: p.stack,
      links: json(p.links),
      cover_url: p.cover ?? null,
      status: "Terbit",
    })),
  ),
  insert(
    "certifications",
    certifications.map((c) => ({
      title: c.title,
      title_jp: c.titleJp,
      kanji: c.kanji,
      tone: c.tone,
      category: c.category,
      issuer: c.issuer,
      year: c.year ?? null,
      score: c.score ?? null,
      note: c.note ?? null,
      credential_url: c.credentialUrl ?? null,
      cover_url: c.cover ?? null,
    })),
  ),
  insert(
    "activities",
    activities.map((a) => ({
      title: a.title,
      role: a.role,
      organizer: a.organizer,
      year: a.year ?? null,
      description: a.description,
      title_jp: a.titleJp,
      kanji: a.kanji,
      tone: a.tone,
      category: a.category,
      photos: a.photos ?? [],
      focus: a.focus ?? null,
    })),
  ),
  insert(
    "posts",
    posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      title_jp: p.titleJp,
      kanji: p.kanji,
      tone: p.tone,
      category: p.category,
      date: p.date,
      read_time: p.readTime,
      excerpt: p.excerpt,
      content: json(p.content),
      cover_url: p.cover ?? null,
      status: "Terbit",
    })),
  ),
  insert("settings", [
    {
      id: 1,
      brand: site.brand,
      name: site.name,
      name_jp: site.nameJp,
      role: site.role,
      description: site.description,
      location: site.location,
      email: site.email,
      photo_url: site.photo || null,
      cv_url: site.cv || null,
      availability: json(site.availability),
      socials: json(site.socials),
      features: json({ chatbot: true, preloader: true }),
    },
  ]),
].join("\n");

writeFileSync("supabase/seed.sql", output);
console.log("supabase/seed.sql dibuat.");
