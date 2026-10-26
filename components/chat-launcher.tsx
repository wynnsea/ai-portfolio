"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import type { SeaAction, SeaReply } from "@/lib/ai/types";
import { useIntro } from "@/components/providers/intro-provider";
import { DemoBadge, ThinkingDots, Typewriter } from "@/components/ai/typewriter";

const ease = [0.16, 1, 0.3, 1] as const;
// Dipakai bersama oleh panel chat dan putaran logo, supaya buka/tutup & putaran selalu selaras
const panelTransition = { duration: 0.4, ease };

const suggestions = [
  "Wayan udah bikin proyek apa aja?",
  "Keahlian Wayan apa aja?",
  "Punya sertifikat apa aja?",
  "Ceritain soal Minori AI RCR",
  "Saya rekruter, cocok gak?",
];

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  action?: SeaAction;
  typed?: boolean;
};

const greeting: Message = { id: 0, role: "assistant", text: "", typed: true };

/** Tombol mengambang + panel chat SEA AI. */
export function ChatLauncher() {
  const { done } = useIntro();
  const settings = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  function markAllTyped() {
    setMessages((prev) => (prev.some((m) => !m.typed) ? prev.map((m) => (m.typed ? m : { ...m, typed: true })) : prev));
  }

  function markMessageTyped(id: number) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, typed: true } : m)));
  }

  function closePanel() {
    markAllTyped();
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePanel();
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
    const history = messages
      .filter((m) => m.id !== 0 && m.text.trim().length > 0)
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((m) => [
      ...m.map((item) => (item.typed ? item : { ...item, typed: true })),
      { id: nextId.current++, role: "user", text: message, typed: true },
    ]);
    setLoading(true);
    try {
      const res = await fetch("/api/sea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data: SeaReply = await res.json();
      setMessages((m) => [
        ...m,
        { id: nextId.current++, role: "assistant", text: data.reply, action: data.action, typed: false },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: nextId.current++,
          role: "assistant",
          text: "Waduh, koneksinya lagi bermasalah. Coba lagi bentar ya.",
          typed: false,
        },
      ]);
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
    if (window.innerWidth < 768) closePanel();
  }

  if (!settings.features.chatbot) return null;

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
            transition={panelTransition}
            className="flex h-[min(560px,calc(100svh-7.5rem))] w-[min(380px,calc(100vw-2.5rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-20px_rgba(42,86,119,0.35)]"
          >
            <div className="flex items-center justify-between bg-primary px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-white p-1">
                  <Image src="/brand/logo.png" alt="" width={28} height={28} className="size-7 object-contain" />
                </span>
                <div>
                  <p className="text-sm font-medium">SEA AI</p>
                  <p className="flex items-center gap-1.5 text-xs text-white/50">
                    <span className="size-1.5 rounded-full bg-accent" /> Online
                  </p>
                </div>
              </div>
              <button type="button" onClick={closePanel} aria-label="Tutup chat" className="grid size-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
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
                      {m.id === 0 ? (
                        `こんにちは! Saya SEA AI, asisten pribadinya ${settings.name}. Mau kepoin proyek, keahlian, pengalaman, atau cara ngontak bos saya? Tanya aja!`
                      ) : m.typed ? (
                        m.text
                      ) : (
                        <Typewriter text={m.text} onDone={() => markMessageTyped(m.id)} />
                      )}
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
        onClick={() => {
          if (open) closePanel();
          else setOpen(true);
        }}
        aria-expanded={open}
        aria-controls="sea-ai-panel"
        aria-label={open ? "Tutup chat SEA AI" : "Buka chat SEA AI"}
        title="SEA AI"
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={done ? { opacity: 1, scale: 1, y: 0 } : undefined}
        transition={{ duration: 0.8, ease, delay: 1.2 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="liquid-glass relative grid size-16 place-items-center rounded-full"
      >
        {/* Logo berputar 90° saat panel terbuka dan kembali saat tertutup, selaras dengan panel */}
        <motion.span
          aria-hidden
          className="relative block size-11"
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={panelTransition}
        >
          <Image src="/brand/logo.png" alt="" width={44} height={44} priority className="size-11 object-contain" />
        </motion.span>
      </motion.button>
    </div>
  );
}
