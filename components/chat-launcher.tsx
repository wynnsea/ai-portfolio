"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { site } from "@/lib/site";
import type { SeaAction, SeaReply } from "@/lib/ai/types";
import { useIntro } from "@/components/providers/intro-provider";
import { DemoBadge, ThinkingDots, Typewriter } from "@/components/ai/typewriter";

const ease = [0.16, 1, 0.3, 1] as const;

const suggestions = [
  "Wayan udah bikin proyek apa aja?",
  "Keahlian Wayan apa aja?",
  "Punya sertifikat apa aja?",
  "Ceritain soal Nihongo Buddy",
  "Saya rekruter, cocok gak?",
];

type Message = { id: number; role: "user" | "assistant"; text: string; action?: SeaAction };

const greetingText = `こんにちは! Saya SEA AI, asisten pribadinya ${site.name}. Mau tau soal proyek, keahlian, pengalaman, atau cara ngontak dia? Tanya aja!`;

const greeting: Message = { id: 0, role: "assistant", text: "" };

/** Tombol mengambang + panel chat SEA AI (versi demo, jawaban dari /api/sea). */
export function ChatLauncher() {
  const { done } = useIntro();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Komponen lain bisa membuka chat lewat event "sea:open"
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("sea:open", onOpen);
    return () => window.removeEventListener("sea:open", onOpen);
  }, []);

  // Ikuti pesan terbaru (juga saat teks sedang "diketik")
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const observer = new MutationObserver(() => (el.scrollTop = el.scrollHeight));
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    el.scrollTop = el.scrollHeight;
    return () => observer.disconnect();
  }, [open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/sea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data: SeaReply = await res.json();
      setMessages((m) => [...m, { id: nextId.current++, role: "assistant", text: data.reply, action: data.action }]);
    } catch {
      setMessages((m) => [...m, { id: nextId.current++, role: "assistant", text: "Waduh, koneksinya lagi bermasalah. Coba lagi bentar ya." }]);
    } finally {
      setLoading(false);
    }
  }

  function runAction(action: SeaAction) {
    const hash = action.href.startsWith("/#") ? action.href.slice(1) : null;
    if (hash && pathname === "/") {
      lenis?.scrollTo(hash, { offset: -24, duration: 1.4 });
    } else {
      router.push(action.href);
    }
    // Di layar kecil, tutup panel supaya halaman tujuan kelihatan
    if (window.innerWidth < 768) setOpen(false);
  }

  return (
    <div data-chat-launcher className="fixed bottom-5 right-5 z-60 flex flex-col items-end gap-3 md:bottom-8 md:right-8">
      <AnimatePresence>
        {open && (
          <motion.div
            id="sea-ai-panel"
            role="dialog"
            aria-label="Chat SEA AI"
            data-lenis-prevent
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.4, ease }}
            className="flex h-[min(560px,calc(100svh-7.5rem))] w-[min(380px,calc(100vw-2.5rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-20px_rgba(42,86,119,0.35)]"
          >
            <div className="flex items-center justify-between bg-primary px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-white font-jp text-primary">海</span>
                <div>
                  <p className="text-sm font-medium">SEA AI</p>
                  <p className="flex items-center gap-1.5 text-xs text-white/50">
                    <span className="size-1.5 rounded-full bg-accent" /> Online · versi demo
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup chat" className="grid size-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
                ✕
              </button>
            </div>

            <div ref={listRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-white">
                    {m.text}
                  </div>
                ) : (
                  <div key={m.id} className="max-w-[88%] space-y-2">
                    <div className="rounded-2xl rounded-tl-sm bg-tertiary px-4 py-3 text-sm leading-relaxed">
                      {m.id === 0 ? greetingText : <Typewriter text={m.text} />}
                    </div>
                    {m.action && (
                      <button
                        type="button"
                        onClick={() => runAction(m.action!)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-primary hover:text-white"
                      >
                        {m.action.label} <span aria-hidden>→</span>
                      </button>
                    )}
                  </div>
                ),
              )}
              {loading && (
                <div className="w-fit rounded-2xl rounded-tl-sm bg-tertiary px-4 py-3.5 text-secondary">
                  <ThinkingDots />
                </div>
              )}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-line px-3 py-1.5 text-left text-xs text-secondary transition-colors hover:border-primary hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"Tanya apa aja soal Wayan…"}
                aria-label="Pesan untuk SEA AI"
                maxLength={500}
                className="flex-1 rounded-full bg-tertiary px-4 py-2.5 text-sm outline-none placeholder:text-secondary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Kirim"
                className="grid size-10 place-items-center rounded-full bg-primary text-white transition-opacity disabled:opacity-30"
              >
                ↑
              </button>
            </form>
            <div className="flex justify-center pb-2 text-secondary">
              <DemoBadge />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="sea-ai-panel"
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={done ? { opacity: 1, scale: 1, y: 0 } : undefined}
        transition={{ duration: 0.8, ease, delay: 1.2 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="group flex h-14 items-center gap-3 rounded-full bg-primary pl-2 pr-5 text-white ring-1 ring-white/15 shadow-[0_20px_40px_-15px_rgba(42,86,119,0.6)]"
      >
        <span className="relative grid size-10 place-items-center rounded-full bg-white font-jp text-lg text-primary">
          {open ? "✕" : "海"}
          {!open && <span className="absolute inset-0 animate-ping rounded-full bg-accent/60 [animation-duration:2.5s]" />}
        </span>
        <span className="text-sm font-medium tracking-wide">SEA AI</span>
      </motion.button>
    </div>
  );
}
