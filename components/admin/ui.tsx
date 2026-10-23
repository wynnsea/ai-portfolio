"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

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
  return <div className={`ad-glass rounded-3xl ${className}`}>{children}</div>;
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
            <div className="flex items-start justify-between gap-4 border-b border-white/70 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-ad-ink">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-ad-muted">{description}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Tutup" className="grid size-9 shrink-0 place-items-center rounded-full text-ad-muted hover:bg-white hover:text-ad-ink">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/70 bg-white/40 px-6 py-4">{footer}</div>}
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

export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    // Properti background ditulis inline: shorthand `background` milik .ad-glass-soft menimpa utilitas bg-*
    <select {...props} className={`${inputBase} h-11 appearance-none pr-10 ${props.className ?? ""}`}
      style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236a7a9c' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundSize: "16px",
        backgroundPosition: "right 1rem center",
        backgroundColor: "rgb(255 255 255 / 0.6)",
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ad-ink md:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ad-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
