"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ExternalLink, Music2, Pause, Play, X } from "lucide-react";
import { useLenis } from "lenis/react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import type { SeaAction, SeaReply } from "@/lib/ai/types";
import { useIntro } from "@/components/providers/intro-provider";
import { AiBadge, ThinkingDots, Typewriter } from "@/components/ai/typewriter";
import { site } from "@/lib/site";
import { detectMusicIntent, pauseMusic, playMusic, toggleMusic, useMusicState } from "@/lib/music/control";

const ease = [0.16, 1, 0.3, 1] as const;
// Dipakai bersama oleh panel chat dan putaran logo, supaya buka/tutup & putaran selalu selaras
const panelTransition = { duration: 0.4, ease };

const suggestions = [
  "Wayan udah bikin proyek apa aja?",
  "Keahlian Wayan apa aja?",
  "Punya sertifikat apa aja?",
  "Ceritain soal Minori AI RCR",
  "Saya rekruter, cocok gak?",
  ...(site.music.src ? ["Putar musik dong 🎵"] : []),
];

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  action?: SeaAction;
  /** Balasan perintah musik: tampilkan kartu lagu dengan tombol putar/jeda */
  music?: boolean;
  typed?: boolean;
};

/** Kartu lagu di balasan SEA AI: putar/jeda musik latar tanpa video. */
function MusicCard() {
  const music = useMusicState();
  return (
    <div className="flex w-64 max-w-full items-center gap-3 rounded-2xl bg-white/90 p-2.5 pr-3 shadow-[0_10px_28px_-18px_rgba(42,86,119,0.5)] ring-1 ring-line/70">
      <button
        type="button"
        onClick={toggleMusic}
        aria-label={music.playing ? "Jeda musik" : "Putar musik"}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-[#1d4260] text-white shadow-[0_8px_18px_-8px_rgba(29,66,96,0.9)] transition hover:brightness-110"
      >
        {music.playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-secondary">
          <Music2 className={`size-3 ${music.playing ? "animate-pulse text-primary" : ""}`} />
          {music.loading ? "Memuat…" : music.playing ? "Sedang diputar" : "Dijeda"}
        </p>
        {music.error && <p className="text-[11px] text-rose-600">{music.error}</p>}
        <p className="truncate text-sm font-medium leading-tight">{site.music.title}</p>
        <p className="truncate text-xs text-secondary">{site.music.artist}</p>
      </div>
      <a
        href={site.music.appUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buka Synseafy"
        title="Buka Synseafy"
        className="grid size-8 shrink-0 place-items-center rounded-full text-secondary transition-colors hover:bg-tertiary hover:text-primary"
      >
        <ExternalLink className="size-4" />
      </a>
    </div>
  );
}

const greeting: Message = { id: 0, role: "assistant", text: "", typed: true };

/** Tombol mengambang + panel chat SEA AI. */
export function ChatLauncher() {
  const { done } = useIntro();
  const settings = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const music = useMusicState();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Kotak input ikut membesar sesuai isi (maks ±5 baris), kembali kecil setelah pesan terkirim
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input, open]);
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

  const onEscape = useEffectEvent(() => closePanel());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
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

    // Perintah musik ("putar musik", "matiin lagu", dll.) ditangani langsung tanpa memanggil AI.
    // play/pause dipanggil di dalam aksi pengguna ini supaya browser mengizinkan audio diputar.
    const intent = detectMusicIntent(message);
    if (intent) {
      let reply: string;
      if (!site.music.src) reply = "Waduh, musiknya belum disetel sama bos saya nih. Nanti ya!";
      else if (intent === "play") {
        playMusic();
        reply = `Siap! Aku puterin "${site.music.title}" dari ${site.music.artist} ya 🎵`;
      } else {
        pauseMusic();
        reply = "Oke, musiknya aku jeda dulu ya. Bilang aja kalau mau diputer lagi.";
      }
      setMessages((m) => [
        ...m.map((item) => (item.typed ? item : { ...item, typed: true })),
        { id: nextId.current++, role: "user", text: message, typed: true },
        { id: nextId.current++, role: "assistant", text: reply, music: Boolean(site.music.src), typed: false },
      ]);
      return;
    }
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
      const data: Partial<SeaReply> & { error?: string } = await res.json();
      const text = res.ok && data.reply ? data.reply : data.error || "Waduh, SEA AI lagi error. Coba lagi bentar ya.";
      setMessages((m) => [
        ...m,
        { id: nextId.current++, role: "assistant", text, action: res.ok ? data.action : undefined, typed: false },
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
            className="flex h-[min(620px,calc(100svh-7.5rem))] w-[min(440px,calc(100vw-2.5rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-white/70 bg-tertiary shadow-[0_40px_90px_-24px_rgba(42,86,119,0.45)] ring-1 ring-line/60"
          >
            <div className="relative flex items-center justify-between overflow-hidden bg-linear-to-br from-primary to-[#1d4260] px-5 py-4 text-white">
              {/* Kilau lembut di header */}
              <span aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full bg-accent/25 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-white p-0.5 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)]">
                  <Image src="/brand/logo-v3.png" alt="" width={36} height={36} className="size-9 object-contain" />
                </span>
                <div>
                  <p className="text-sm font-medium">SEA AI</p>
                  <p className="flex items-center gap-1.5 text-xs text-white/50">
                    <span className="size-1.5 rounded-full bg-accent" /> Online
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Tutup chat"
                className="relative grid size-8 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1">
              {/* Latar: gradien buih laut + cahaya lembut + kanji 海 (laut) sebagai watermark */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_55%_at_100%_0%,rgba(167,216,242,0.45),transparent_60%),radial-gradient(90%_45%_at_0%_100%,rgba(42,86,119,0.10),transparent_70%),linear-gradient(180deg,#f8fbfe_0%,#edf5fb_100%)]"
              />
              <span
                aria-hidden
                className="text-outline pointer-events-none absolute -bottom-8 -right-3 select-none font-jp text-[12rem] leading-none"
              >
                海
              </span>
            <div ref={listRef} aria-live="polite" className="relative h-full space-y-3 overflow-y-auto px-4 py-5">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-2xl rounded-tr-sm bg-linear-to-br from-primary to-[#1d4260] px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_10px_24px_-14px_rgba(29,66,96,0.8)]">
                    {m.text}
                  </div>
                ) : (
                  <div key={m.id} className="w-fit max-w-[88%] space-y-2">
                    <div className="w-fit wrap-break-word rounded-2xl rounded-tl-sm bg-white/90 px-4 py-3 text-sm leading-relaxed shadow-[0_10px_28px_-18px_rgba(42,86,119,0.5)] ring-1 ring-line/70 backdrop-blur-sm">
                      {m.id === 0 ? (
                        `こんにちは! Saya SEA AI, asisten pribadinya ${settings.name}. Mau kepoin proyek, keahlian, pengalaman, atau cara ngontak bos saya? Tanya aja!`
                      ) : m.typed ? (
                        m.text
                      ) : (
                        <Typewriter text={m.text} onDone={() => markMessageTyped(m.id)} />
                      )}
                    </div>
                    {m.music && <MusicCard />}
                    {m.action && (
                      <button
                        type="button"
                        onClick={() => runAction(m.action!)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/70 bg-white/70 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-primary hover:text-white"
                      >
                        {m.action.label} <span aria-hidden>→</span>
                      </button>
                    )}
                  </div>
                ),
              )}
              {loading && (
                <div className="w-[82%] max-w-65 animate-pulse space-y-2 rounded-2xl rounded-tl-sm bg-white/90 px-4 py-3 text-secondary shadow-[0_10px_28px_-18px_rgba(42,86,119,0.5)] ring-1 ring-line/70">
                  <div className="flex items-center gap-2">
                    <ThinkingDots />
                    <span className="text-[11px] text-secondary/70">SEA AI lagi ngetik...</span>
                  </div>
                  <div className="h-2.5 w-5/6 rounded-full bg-line/60" />
                  <div className="h-2.5 w-3/5 rounded-full bg-line/40" />
                </div>
              )}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-left text-xs text-secondary backdrop-blur-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="relative border-t border-white/80 bg-white/75 px-3 pb-2.5 pt-3 backdrop-blur-md"
            >
              <div className="flex items-end gap-2 rounded-2xl bg-white p-1.5 pl-4 shadow-[0_12px_32px_-20px_rgba(42,86,119,0.55)] ring-1 ring-line transition-shadow focus-within:shadow-[0_12px_32px_-16px_rgba(42,86,119,0.6)] focus-within:ring-2 focus-within:ring-primary/35">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter = kirim, Shift+Enter = baris baru (abaikan saat sedang mengetik dengan IME)
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={`Tanya apa aja soal ${settings.name}…`}
                  aria-label="Pesan untuk SEA AI"
                  maxLength={500}
                  className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm leading-relaxed text-primary outline-none placeholder:text-secondary/60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Kirim"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary to-[#1d4260] text-white shadow-[0_8px_18px_-8px_rgba(29,66,96,0.9)] transition-[filter,transform,opacity] hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none"
                >
                  <ArrowUp className="size-4" strokeWidth={2.4} />
                </button>
              </div>
              {/* <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[10px] text-secondary/70">
                <span className="hidden sm:inline">Enter untuk kirim · Shift+Enter baris baru</span>
                <span className="ml-auto flex items-center gap-2">
                  {input.length > 400 && <span className="tabular-nums">{input.length}/500</span>}
                  <AiBadge className="text-secondary" />
                </span>
              </div> */}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Musik sedang jalan & chat tertutup: tombol jeda kecil di atas tombol SEA AI */}
      <AnimatePresence>
        {music.playing && !open && (
          <motion.button
            type="button"
            onClick={pauseMusic}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            aria-label={`Jeda musik ${site.music.title}`}
            title={`${site.music.title} — ${site.music.artist}`}
            className="liquid-glass flex items-center gap-2 rounded-full py-2 pl-2 pr-3.5 text-xs font-medium text-primary"
          >
            <span className="grid size-7 place-items-center rounded-full bg-primary text-white">
              <Pause className="size-3.5" />
            </span>
            {/* Bar ekualizer kecil sebagai tanda musik sedang diputar */}
            <span aria-hidden className="flex h-3 items-end gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-0.5 rounded-full bg-primary"
                  animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                />
              ))}
            </span>
            <span className="max-w-32 truncate">{site.music.title}</span>
          </motion.button>
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
          className="relative block size-12"
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={panelTransition}
        >
          <Image src="/brand/logo-v3.png" alt="" width={48} height={48} priority className="size-12 object-contain" />
        </motion.span>
      </motion.button>
    </div>
  );
}
