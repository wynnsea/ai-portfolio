import { GoogleGenAI, ApiError } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// (A) Daftar model, dicoba berurutan dari kiri
// const daftarModel = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-lite-latest"];
const daftarModel = ["model-ngasal", "gemini-3.5-flash"];

// (B) Schema dipisah ke variabel biar loop-nya gak kepanjangan
const schema = {
  type: "object",
  properties: {
    posisi: { type: "string" },
    skill: { type: "array", items: { type: "string" } },
  },
  required: ["posisi", "skill"],
};

// (C) Disiapin di LUAR loop, biar masih bisa dipakai setelah loop selesai
let res = null;

for (const model of daftarModel) {
  const mulai = Date.now();

  try {
    res = await ai.models.generateContent({
      model, // singkatan dari  model: model
      contents: "Lowongan: Junior Python developer. Wajib FastAPI dan PostgreSQL. Nilai plus: Docker.",
      config: {
        httpOptions: { timeout: 20_000 },
        responseMimeType: "application/json",
        responseJsonSchema: schema,
      },
    });

    console.log(`✓ ${model} berhasil (${Date.now() - mulai} ms)`);
    break; // (D) Udah berhasil, keluar dari loop

  } catch (e) {
    // (E) Server sibuk atau kuota habis → coba model berikutnya
    if (e instanceof ApiError && (e.status === 404 || e.status === 429 || e.status >= 500)) {
      console.log(`✗ ${model} sibuk (status ${e.status}), coba model berikutnya...`);
      continue;
    }

    // (F) Request-nya salah (400 dll) → dicoba ulang juga percuma
    if (e instanceof ApiError) {
      console.log(`✗ ${model} request salah (status ${e.status}): ${e.message}`);
      break;
    }

    // (G) Bukan ApiError: timeout atau jaringan putus → coba model berikutnya
    console.log(`✗ ${model} timeout/jaringan: ${e.message}`);
  }
}

// (H) Setelah loop: ada hasil atau enggak?
if (!res) {
  console.log("Semua model gagal → pakai mock");
} else {
  console.log("Model:", res.modelVersion);
  console.log("Hasil:", JSON.parse(res.text));
  console.log("Token:", res.usageMetadata);
}
