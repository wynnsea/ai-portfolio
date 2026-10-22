"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import type { SearchItem } from "@/lib/ai/types";
import { DemoBadge } from "@/components/ai/typewriter";

// DEMO: pencarian kata kunci + sinonim sederhana, meniru pencarian semantik.
// Versi asli: embed query & dokumen pakai API embeddings lalu urutkan berdasarkan kemiripan.
const SYNONYMS: Record<string, string[]> = {
  chatbot: ["llm", "chat", "tutor", "rag"],
  chat: ["llm", "tutor"],
  gambar: ["vision", "kamera", "foto"],
  foto: ["vision", "kamera", "wajah"],
  kamera: ["vision", "face"],
  wajah: ["face", "vision"],
  jepang: ["japan", "kanji", "nihongo", "sakura", "ramen", "anime", "kaizen"],
  japan: ["jepang", "kanji", "nihongo"],
  cari: ["search", "embeddings"],
  rekomendasi: ["recommendation", "match", "search"],
  review: ["sentimen", "insight"],
  karier: ["career", "kerja", "coordinator"],
  kerja: ["pengalaman", "coordinator", "karier"],
  prompt: ["json", "structured"],
  ringkas: ["summary", "tl;dr"],
  tulisan: ["blog", "artikel"],
  artikel: ["blog"],
  proyek: ["project"],
};

// Kata sambung yang diabaikan supaya kalimat bebas tetap bisa dicari
const STOPWORDS = new Set(["yang", "pakai", "pake", "soal", "tentang", "dan", "di", "ke", "buat", "untuk", "dengan", "ada", "aja", "apa", "gimana", "the", "a"]);

function score(item: SearchItem, query: string) {
  const title = item.title.toLowerCase();
  const hay = `${item.type} ${title} ${item.subtitle} ${item.keywords}`.toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter((w) => w && !STOPWORDS.has(w));
  if (!words.length) return 0;
  let total = 0;
  for (const word of words) {
    const variants = [word, ...(SYNONYMS[word] ?? [])];
    let best = 0;
    for (const v of variants) {
      if (title.includes(v)) best = Math.max(best, v === word ? 5 : 3);
      else if (hay.includes(v)) best = Math.max(best, v === word ? 2 : 1);
    }
    if (best === 0) return 0; // semua kata harus nyambung
    total += best;
  }
  return total;
}

/** Pencarian ⌘K / Ctrl+K untuk project, artikel, dan section. */
export function CommandPalette({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  const results = useMemo(() => {
    if (!query.trim()) return items.filter((i) => i.type !== "Blog").slice(0, 6);
    return items
      .map((item) => ({ item, s: score(item, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.item);
  }, [items, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("search:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("search:open", onOpen);
    };
  }, []);

  // Kunci scroll saat terbuka. start() hanya dipanggil saat menutup,
  // supaya tidak membuka kunci scroll milik layar intro.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      lenis?.stop();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (wasOpen.current) {
      lenis?.start();
    }
    wasOpen.current = open;
  }, [open, lenis]);

  function go(item: SearchItem) {
    close();
    const hash = item.href.startsWith("/#") ? item.href.slice(1) : null;
    if (hash && pathname === "/") lenis?.scrollTo(hash, { offset: -24, duration: 1.4 });
    else router.push(item.href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex items-start justify-center bg-primary/40 px-4 pt-[14vh] backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-label="Cari"
            data-lenis-prevent
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-20px_rgba(42,86,119,0.5)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <span aria-hidden className="text-secondary">⌕</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") close();
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, results.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  }
                  if (e.key === "Enter" && results[active]) go(results[active]);
                }}
                placeholder={'Coba "project pakai kamera" atau "tulisan soal jepang"'}
                aria-label="Kata kunci pencarian"
                className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-secondary"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-secondary">ESC</kbd>
            </div>

            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-secondary">Gak ketemu nih. Coba kata lain atau tanya SEA AI.</li>}
              {results.map((item, i) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className={`flex w-full items-start gap-4 rounded-xl px-4 py-3 text-left transition-colors ${i === active ? "bg-tertiary" : ""}`}
                  >
                    <span className="mt-0.5 w-14 shrink-0 text-[10px] uppercase tracking-[0.15em] text-secondary">{item.type}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      <span className="block truncate text-xs text-secondary">{item.subtitle}</span>
                    </span>
                    {i === active && <span aria-hidden className="text-secondary">↵</span>}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-secondary">
              <span>↑↓ pilih · ↵ buka</span>
              <DemoBadge />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
