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
    description:
      "Memanggil dan mengintegrasikan API LLM seperti OpenAI, Claude, Gemini. Termasuk streaming, structured output (JSON schema), function/tool calling, dan generative AI di aplikasi web.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "rag",
    label: "RAG (Retrieval-Augmented Generation)",
    level: "solid",
    description:
      "Membangun pipeline Retrieval-Augmented Generation (RAG), chunking dokumen, retrieval konteks, grounding jawaban AI agar tidak halusinasi.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "vector-db",
    label: "Vector Database & Embeddings",
    level: "solid",
    description:
      "Mengelola vector database dan semantic search menggunakan embeddings (pgvector, Pinecone, Chroma, MemoryVectorStore, text-embedding).",
    evidence: [],
  },
  {
    id: "prompt-engineering",
    label: "Prompt Engineering",
    level: "solid",
    description:
      "Merancang system prompt, few-shot prompting, guardrail anti-prompt-injection, rubrik penilaian AI, dan memastikan output LLM konsisten.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "langchain",
    label: "LangChain & LangGraph",
    level: "solid",
    description:
      "Orkestrasi aplikasi AI, agentic workflow, chaining, state graph, dan RAG menggunakan LangChain, LangGraph, atau LlamaIndex.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "ai-automation",
    label: "Otomasi AI & Workflow",
    level: "solid",
    description:
      "Otomatisasi proses bisnis dengan AI, grading otomatis, ekstraksi data dokumen/biodata, dan integrasi AI ke alur kerja operasional.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "nextjs",
    label: "Next.js",
    level: "solid",
    description:
      "Pengembangan aplikasi web full-stack menggunakan Next.js (App Router, Server Components, Route Handlers, SSR/SSG).",
    evidence: [],
  },
  {
    id: "react",
    label: "React",
    level: "solid",
    description:
      "Membangun antarmuka pengguna interaktif dan komponen frontend modern menggunakan React, hooks, dan state management.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "typescript",
    label: "TypeScript & JavaScript",
    level: "solid",
    description:
      "Pemrograman menggunakan TypeScript dan JavaScript modern (ES6+, Node.js, type safety).",
    evidence: [],
  },
  {
    id: "tailwind",
    label: "Tailwind CSS & UI Styling",
    level: "solid",
    description:
      "Styling antarmuka web responsif, animasi (Framer Motion, Lenis), dan design system menggunakan Tailwind CSS dan CSS modern.",
    evidence: [],
  },
  {
    id: "python",
    label: "Python",
    level: "solid",
    description:
      "Pemrograman Python untuk backend AI, pengolahan data, scripting, dan integrasi layanan LLM.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "fastapi",
    label: "FastAPI",
    level: "solid",
    description:
      "Membangun REST API dan microservice AI berkinerja tinggi dengan Python FastAPI atau Flask.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "laravel",
    label: "Laravel & PHP",
    level: "solid",
    description:
      "Pengembangan aplikasi web full-stack dan backend menggunakan framework Laravel dan PHP.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "rest-api",
    label: "REST API & Integrasi Sistem",
    level: "solid",
    description:
      "Merancang, membangun, dan menguji RESTful API, webhook, serta menghubungkan layanan frontend, backend, dan pihak ketiga (Postman).",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "sql-db",
    label: "PostgreSQL, MySQL & Supabase",
    level: "solid",
    description:
      "Perancangan skema database relasional, query SQL, PostgreSQL, MySQL, serta Backend-as-a-Service Supabase (Auth, RLS, Storage).",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "git",
    label: "Git & Kolaborasi Kode",
    level: "solid",
    description:
      "Version control menggunakan Git, GitHub, GitLab, branching workflow, dan kolaborasi tim.",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "docker",
    label: "Docker & Linux",
    level: "dasar",
    description:
      "Containerization aplikasi menggunakan Docker, Docker Compose, deployment di Vercel/VPS, dan penggunaan sistem operasi Linux.",
    evidence: [],
  },
  {
    id: "japanese",
    label: "Bahasa Jepang (JLPT N4)",
    level: "solid",
    description:
      "Kemampuan berbahasa Jepang bersertifikat JLPT N4 dan pemahaman budaya kerja Jepang (Kaizen, komunikasi bisnis dasar).",
    evidence: ["minori-ai-rcr"],
  },
  {
    id: "english",
    label: "Bahasa Inggris (TOEFL & iTEP B1)",
    level: "solid",
    description:
      "Kemampuan bahasa Inggris tingkat menengah (CEFR B1 / iTEP Essential & TOEFL Prediction 477) untuk membaca dokumentasi teknis dan komunikasi.",
    evidence: [],
  },
  {
    id: "kubernetes",
    label: "Kubernetes",
    level: "belum",
    description: "Orkestrasi container skala besar: Kubernetes, k8s, Helm.",
    evidence: [],
  },
  {
    id: "cloud-infra",
    label: "AWS / GCP / Azure",
    level: "belum",
    description:
      "Infrastruktur cloud enterprise seperti AWS (EC2, S3, Lambda, SageMaker), Google Cloud Platform (GCP), atau Microsoft Azure.",
    evidence: [],
  },
  {
    id: "model-training",
    label: "Pre-training & Fine-tuning Model (PyTorch/TensorFlow)",
    level: "belum",
    description:
      "Melatih model deep learning dari nol atau fine-tuning bobot model menggunakan PyTorch, TensorFlow, CUDA.",
    evidence: [],
  },
  {
    id: "mlops",
    label: "MLOps",
    level: "belum",
    description:
      "Pipeline MLOps skala produksi seperti MLflow, Kubeflow, DVC, model registry, dan monitoring drift.",
    evidence: [],
  },
  {
    id: "data-engineering",
    label: "Big Data Engineering",
    level: "belum",
    description:
      "Pipeline big data dan ETL skala besar menggunakan Apache Spark, Kafka, Airflow, Hadoop, atau Snowflake.",
    evidence: [],
  },
];
