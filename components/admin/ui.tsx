"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Search, X } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;
const noopSubscribe = () => () => {};

/* ---------- Latar belakang: gradien biru soft + blob blur (memberi "isi" untuk efek kaca) ---------- */
export function AdminBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#eef3ff]">
      <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-[#9fc1ff] opacity-50 blur-3xl" />
      <div className="absolute -right-32 top-1/4 size-[30rem] rounded-full bg-[#c7d8ff] opacity-70 blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 size-[36rem] rounded-full bg-[#b5e3ff] opacity-50 blur-3xl" />
    </div>
  );
}

/* ---------- Kartu kaca ---------- */
export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`ad-glass min-w-0 rounded-3xl ${className}`}>{children}</div>;
}

/* ---------- Tombol ---------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-gradient-to-br from-ad to-ad-deep text-white shadow-[0_10px_24px_-12px_rgba(47,98,214,0.8)] hover:brightness-110",
    outline: "ad-glass-soft text-ad-deep ring-1 ring-ad-line/80 hover:bg-white",
    ghost: "text-ad-muted hover:bg-ad-soft hover:text-ad-deep",
    danger: "bg-rose-500 text-white shadow-[0_10px_24px_-12px_rgba(244,63,94,0.8)] hover:bg-rose-600",
  };
  const sizes = { sm: "h-9 px-3.5 text-xs", md: "h-11 px-5 text-sm" };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------- Badge status ---------- */
const badgeTones: Record<string, string> = {
  Terbit: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Dibalas: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Draft: "bg-amber-50 text-amber-700 ring-amber-200",
  Dibaca: "bg-ad-soft text-ad-deep ring-ad-line",
  Baru: "bg-rose-50 text-rose-600 ring-rose-200",
  Arsip: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function Badge({ children }: { children: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${badgeTones[children] ?? "bg-ad-soft text-ad-deep ring-ad-line"}`}>
      {children}
    </span>
  );
}

/* ---------- Modal (popup) ---------- */
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
};

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  // true hanya di browser (portal butuh document.body), false saat render di server
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ad-ink/25 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
            className={`ad-glass flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl ${size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/70 px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-lg font-semibold text-ad-ink">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-ad-muted">{description}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Tutup" className="grid size-9 shrink-0 place-items-center rounded-full text-ad-muted hover:bg-white hover:text-ad-ink">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
            {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/70 bg-white/40 px-4 py-3 sm:px-6 sm:py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------- Input form ---------- */
const inputBase =
  "ad-glass-soft w-full rounded-2xl px-4 text-sm text-ad-ink outline-none ring-1 ring-ad-line/80 transition placeholder:text-ad-muted/70 focus:border-ad focus:ring-4 focus:ring-ad/15";

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ad-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint && <span className="mt-1 block text-xs text-ad-muted">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} h-11 ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${inputBase} resize-none py-3 ${props.className ?? ""}`} />;
}

export type SelectProps = {
  options: string[];
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  "aria-label"?: string;
};

export function Select({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  name,
  disabled = false,
  className = "",
  size = "md",
  "aria-label": ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tutup dropdown saat klik di luar atau tekan ESC
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Auto-focus search input jika opsi > 20
  useEffect(() => {
    if (open && options.length > 20 && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open, options.length]);

  const hasSearch = options.length > 20;
  const filteredOptions = hasSearch && search.trim()
    ? options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (opt: string) => {
    onChange?.({ target: { value: opt, name } });
    setOpen(false);
    setSearch("");
  };

  const isSmall = size === "sm";

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Tombol Trigger Select */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder}
        onClick={() => setOpen((prev) => !prev)}
        className={`ad-glass-soft flex w-full items-center justify-between gap-2 text-left text-ad-ink outline-none ring-1 ring-ad-line/80 transition hover:bg-white/90 focus:border-ad focus:ring-4 focus:ring-ad/15 disabled:cursor-not-allowed disabled:opacity-50 ${
          isSmall ? "h-9 rounded-xl px-3 text-xs" : "h-11 rounded-2xl px-4 text-sm"
        }`}
      >
        <span className={`truncate ${!value ? "text-ad-muted" : "font-medium"}`}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-ad-muted transition-transform duration-200 ${
            open ? "rotate-180 text-ad" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Mengambang */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-[140px] overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-ad-line/80 backdrop-blur-xl"
            style={{ maxHeight: hasSearch ? "300px" : "240px" }}
          >
            {/* Input Pencarian jika opsi > 20 */}
            {hasSearch && (
              <div className="mb-1.5 border-b border-ad-line/60 p-1">
                <div className="flex items-center gap-2 rounded-xl bg-ad-soft/60 px-2.5 py-1.5 text-xs ring-1 ring-ad-line/40">
                  <Search className="size-3.5 shrink-0 text-ad-muted" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari opsi..."
                    className="w-full bg-transparent text-xs text-ad-ink placeholder:text-ad-muted outline-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-ad-muted hover:text-ad-ink"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Daftar Opsi */}
            <ul
              role="listbox"
              className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5 text-xs sm:text-sm"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-3 text-center text-xs text-ad-muted">
                  Tidak ada opsi yang cocok
                </li>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt === value;
                  return (
                    <li key={opt} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => handleSelect(opt)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs sm:text-sm transition ${
                          isSelected
                            ? "bg-ad-soft/90 font-semibold text-ad-deep ring-1 ring-ad/20"
                            : "text-ad-ink hover:bg-ad-soft/40 hover:text-ad-deep"
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check className="size-3.5 shrink-0 text-ad ml-2" />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-ad" : "bg-ad-line"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

/* ---------- Toast (notifikasi kecil) ---------- */
type Toast = { id: number; message: string; tone: "success" | "error" };
const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-[110] flex flex-col items-end gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.3, ease }}
              className="ad-glass pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm text-ad-ink"
            >
              {t.tone === "success" ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertTriangle className="size-4 text-rose-600" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/* ---------- Judul halaman ---------- */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-ad-ink sm:text-3xl md:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-xs text-ad-muted sm:text-sm leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">{actions}</div>}
    </div>
  );
}
