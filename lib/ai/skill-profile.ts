// Sumber kebenaran untuk Job Match: AI hanya memetakan syarat lowongan ke id di sini,
// level dan bukti ditentukan oleh data ini, bukan oleh AI.

export type SkillLevel = "solid" | "dasar" | "belum"; // union type

export type Skill = {
  id: string;          // kunci unik yang nanti dipilih AI, format kebab-case
  label: string;       // nama yang tampil di UI
  level: SkillLevel;
  description: string; // bantu AI nyocokin: sinonim, tools, cakupan skill-nya
  evidence: string[];  // slug project di lib/projects.ts yang jadi bukti
};

export const skillProfile: Skill[] = [
  {
    id: "llm-api",
    label: "Integrasi LLM API",
    level: "solid",
    description: "Memanggil API LLM seperti OpenAI, Claude, Gemini. Termasuk streaming, structured output, dan generative AI di aplikasi.",
    evidence: ["nihongo-buddy", "kanji-lens"],
  },
  {
    id: "kubernetes",
    label: "Kubernetes",
    level: "belum",
    description: "Orkestrasi container: Kubernetes, k8s, Helm.",
    evidence: [],
  },
  // ...lanjutin sendiri
];
