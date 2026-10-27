"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Award, CalendarDays, ExternalLink, FolderKanban, Mail, Pause, PenLine, Play, Plus, Square } from "lucide-react";
import { site } from "@/lib/site";
import { getDashboard, getSettings, type DashboardData } from "@/lib/admin/api";
import { Badge, Card, PageHeader, useToast } from "@/components/admin/ui";

const ease = [0.16, 1, 0.3, 1] as const;

/* ---------- Kartu statistik ---------- */
function StatCard({
  label,
  value,
  note,
  href,
  icon: Icon,
  highlight,
  index,
}: {
  label: string;
  value: number;
  note: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  index: number;
}) {
  return (
    <motion.div className="min-w-0" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.06, ease }}>
      <Link
        href={href}
        className={`group relative block h-full overflow-hidden rounded-2xl p-3.5 sm:rounded-3xl sm:p-5 transition hover:-translate-y-0.5 ${
          highlight ? "bg-gradient-to-br from-ad to-ad-deep text-white shadow-[0_18px_40px_-20px_rgba(47,98,214,0.9)]" : "ad-glass-soft"
        }`}
      >
        {highlight && <div aria-hidden className="absolute -right-8 -top-8 size-28 rounded-full border-[14px] border-white/10" />}
        <div className="relative flex items-start justify-between">
          <span className={`grid size-8 sm:size-10 place-items-center rounded-xl sm:rounded-2xl ${highlight ? "bg-white/15" : "bg-ad-soft text-ad-deep"}`}>
            <Icon className="size-4 sm:size-5" />
          </span>
          <span
            className={`grid size-7 sm:size-9 place-items-center rounded-full border transition group-hover:rotate-45 ${
              highlight ? "border-white/40 bg-white text-ad-deep" : "border-ad-line text-ad-ink"
            }`}
          >
            <ArrowUpRight className="size-3.5 sm:size-4" />
          </span>
        </div>
        <p className={`relative mt-3.5 sm:mt-5 text-xs sm:text-sm ${highlight ? "text-white/80" : "text-ad-muted"}`}>{label}</p>
        <p className="relative mt-0.5 sm:mt-1 text-2xl sm:text-4xl font-semibold tracking-tight">{value}</p>
        <p className={`relative mt-2 sm:mt-3 truncate text-[11px] sm:text-xs ${highlight ? "text-white/70" : "text-ad-muted"}`}>{note}</p>
      </Link>
    </motion.div>
  );
}

/* ---------- Grafik pengunjung mingguan (pill bar) ---------- */
function VisitorChart({ weeklyVisitors }: { weeklyVisitors: DashboardData["weeklyVisitors"] }) {
  const max = Math.max(1, ...weeklyVisitors.map((d) => d.value));
  const past = weeklyVisitors.filter((d) => !d.future);
  const peak = past.reduce((a, b) => (b.value > a.value ? b : a), past[0] ?? { day: "", value: 0, future: false });
  return (
    <Card className="p-4 sm:p-6 md:col-span-2 lg:col-span-2">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-ad-ink">Pengunjung Website</h2>
          <p className="text-[11px] sm:text-xs text-ad-muted">Minggu ini (Senin–Minggu, WIB)</p>
        </div>
        <div className="flex flex-wrap gap-2.5 text-[11px] text-ad-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-ad" /> Tercatat
          </span>
          <span className="flex items-center gap-1.5">
            <span className="ad-hatch size-2.5 rounded-full ring-1 ring-ad/40" /> Perkiraan
          </span>
        </div>
      </div>
      <div className="mt-5 sm:mt-6 flex h-36 sm:h-48 items-end justify-between gap-1 sm:gap-4 w-full" role="img" aria-label={`Grafik pengunjung, tertinggi ${peak.value} pada ${peak.day}`}>
        {weeklyVisitors.map((d, i) => {
          const isPeak = d === peak;
          return (
            <div key={d.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 sm:gap-2">
              <div className="relative flex w-full max-w-[28px] sm:max-w-11 flex-1 items-end justify-center">
                {isPeak && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full rounded-full bg-ad-ink px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white shadow">
                    {d.value}
                  </span>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.value / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease }}
                  title={`${d.day}: ${d.value} pengunjung`}
                  className={`w-full rounded-full ${
                    d.future ? "ad-hatch ring-1 ring-inset ring-ad/30" : isPeak ? "bg-gradient-to-t from-ad-deep to-ad" : "bg-ad/70"
                  }`}
                />
              </div>
              <span className={`text-[11px] sm:text-xs truncate ${isPeak ? "font-semibold text-ad-ink" : "text-ad-muted"}`}>{d.day}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Pengingat ---------- */
function Reminder() {
  return (
    <Card className="flex flex-col p-4 sm:p-6 md:col-span-2 lg:col-span-1">
      <h2 className="text-base sm:text-lg font-semibold">Pengingat</h2>
      <p className="mt-2.5 sm:mt-4 text-base sm:text-xl font-semibold leading-snug text-ad-deep">Lengkapi CV & tulis artikel pertama</p>
      <p className="mt-1 text-xs sm:text-sm text-ad-muted">Biar halaman blog dan tombol download CV nggak kosong lagi.</p>
      <Link
        href="/admin/artikel"
        className="mt-auto flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-ad to-ad-deep text-sm font-medium text-white shadow-[0_10px_24px_-12px_rgba(47,98,214,0.8)] transition hover:brightness-110 max-lg:mt-6"
      >
        <PenLine className="size-4" /> Mulai menulis
      </Link>
    </Card>
  );
}

/* ---------- Konten terbaru ---------- */
function LatestContent({ content }: { content: DashboardData["latestContent"] }) {
  const items = content.map((item) => {
    const type = item.type === "project" ? "Proyek" : item.type === "certification" ? "Sertifikasi" : item.type === "activity" ? "Kegiatan" : "Artikel";
    const href = item.type === "project" ? "/admin/proyek" : item.type === "certification" ? "/admin/sertifikasi" : item.type === "activity" ? "/admin/kegiatan" : "/admin/artikel";
    const icon = item.type === "project" ? FolderKanban : item.type === "certification" ? Award : item.type === "activity" ? CalendarDays : PenLine;
    return { ...item, type, href, icon };
  });

  return (
    <Card className="p-4 sm:p-6 md:col-span-1 lg:col-span-1">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold">Konten Terbaru</h2>
        <Link href="/admin/proyek" className="flex items-center gap-1 rounded-full border border-ad-line px-3 py-1 text-xs text-ad-deep hover:bg-white">
          <Plus className="size-3.5" /> Baru
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-ad-muted">Belum ada konten.</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {items.map((it) => (
            <li key={`${it.type}-${it.title}`}>
              <Link href={it.href} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/60">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ad-soft text-ad-deep">
                  <it.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{it.title}</span>
                  <span className="block text-xs text-ad-muted">
                    {it.type}
                    {it.year && ` · ${it.year}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- Pesan masuk ---------- */
function Inbox({ messages }: { messages: DashboardData["latestMessages"] }) {
  return (
    <Card className="p-4 sm:p-6 md:col-span-2 lg:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold">Pesan Masuk</h2>
        <Link href="/admin/pesan" className="rounded-full border border-ad-line px-3 py-1 text-xs text-ad-deep hover:bg-white">
          Lihat semua
        </Link>
      </div>
      {messages.length === 0 ? (
        <p className="mt-6 text-sm text-ad-muted">Belum ada pesan.</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {messages.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 sm:gap-3 rounded-2xl p-2 transition hover:bg-white/60">
              <span className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ad-soft to-white text-xs sm:text-sm font-semibold text-ad-deep ring-1 ring-ad-line">
                {m.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs sm:text-sm font-medium text-ad-ink">{m.name}</span>
                <span className="block truncate text-[11px] sm:text-xs text-ad-muted">{m.subject}</span>
              </span>
              <span className="shrink-0">
                <Badge>{m.status}</Badge>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- Kelengkapan profil (semi donut) ---------- */
function ProfileProgress({ checks }: { checks: DashboardData["profileCompleteness"]["checks"] }) {
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);
  const r = 80;
  const arc = Math.PI * r;

  return (
    <Card className="p-4 sm:p-6 md:col-span-1 lg:col-span-1">
      <h2 className="text-base sm:text-lg font-semibold">Kelengkapan Profil</h2>
      <div className="relative mx-auto mt-4 w-full max-w-60">
        <svg viewBox="0 0 200 110" className="w-full" aria-hidden>
          <defs>
            <pattern id="ad-hatch-p" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <rect width="2" height="7" fill="rgb(79 134 247 / 0.35)" />
            </pattern>
          </defs>
          <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#ad-hatch-p)" strokeWidth="22" strokeLinecap="round" />
          <motion.path
            d="M20 100 A80 80 0 0 1 180 100"
            fill="none"
            stroke="#4f86f7"
            strokeWidth="22"
            strokeLinecap="round"
            strokeDasharray={arc}
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: arc * (1 - pct / 100) }}
            transition={{ duration: 1.1, delay: 0.3, ease }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="text-3xl font-semibold">{pct}%</p>
          <p className="text-xs text-ad-muted">
            {done} dari {checks.length} lengkap
          </p>
        </div>
      </div>
      <ul className="mt-5 flex flex-wrap justify-center gap-1.5">
        {checks.map((c) => (
          <li key={c.label} className={`rounded-full px-2.5 py-1 text-[11px] ${c.done ? "bg-ad text-white" : "bg-ad-soft text-ad-muted"}`}>
            {c.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- Focus timer ---------- */
function FocusTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c2a4a] via-[#22408a] to-ad-deep p-4 sm:p-6 text-white">
      {/* gelombang dekoratif */}
      <svg aria-hidden viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-0 size-full opacity-30">
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M0 ${120 + i * 18} C 100 ${80 + i * 18}, 200 ${170 + i * 18}, 400 ${110 + i * 18}`} fill="none" stroke="white" strokeOpacity={0.35 - i * 0.07} strokeWidth="1.5" />
        ))}
      </svg>
      <div className="relative">
        <h2 className="text-base sm:text-lg font-semibold">Focus Timer</h2>
        <p className="text-xs text-white/60">Buat sesi ngoding / nulis tanpa distraksi</p>
        <p className="mt-4 sm:mt-6 font-mono text-3xl sm:text-4xl font-semibold tabular-nums tracking-wider" aria-live="off">
          {hh}:{mm}:{ss}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            aria-label={running ? "Jeda" : "Mulai"}
            className="grid size-12 place-items-center rounded-full bg-white text-ad-deep transition hover:scale-105"
          >
            {running ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setSeconds(0);
            }}
            aria-label="Stop"
            className="grid size-12 place-items-center rounded-full bg-rose-500 text-white transition hover:scale-105"
          >
            <Square className="size-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard Skeleton ---------- */
function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat dashboard">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 animate-pulse">
          <div className="h-8 w-36 rounded-2xl bg-ad-line/60" />
          <div className="h-4 w-64 rounded-full bg-ad-line/40" />
        </div>
        <div className="flex gap-3 animate-pulse">
          <div className="h-11 w-36 rounded-full bg-ad-line/60" />
          <div className="h-11 w-32 rounded-full bg-ad-line/40" />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ad-glass-soft animate-pulse rounded-3xl p-5">
            <div className="flex items-start justify-between">
              <div className="size-10 rounded-2xl bg-ad-line/50" />
              <div className="size-9 rounded-full bg-ad-line/40" />
            </div>
            <div className="mt-5 h-4 w-20 rounded-full bg-ad-line/40" />
            <div className="mt-2 h-9 w-16 rounded-xl bg-ad-line/60" />
            <div className="mt-3 h-3 w-32 rounded-full bg-ad-line/30" />
          </div>
        ))}
      </div>

      {/* 3-Column Grid Skeleton */}
      <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Visitor Chart Skeleton */}
        <Card className="p-4 sm:p-6 md:col-span-2 lg:col-span-2 animate-pulse">
          <div className="flex justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-44 rounded-xl bg-ad-line/50" />
              <div className="h-3 w-64 rounded-full bg-ad-line/30" />
            </div>
            <div className="flex gap-3">
              <div className="h-4 w-16 rounded-full bg-ad-line/40" />
              <div className="h-4 w-16 rounded-full bg-ad-line/40" />
            </div>
          </div>
          <div className="mt-6 flex h-36 sm:h-48 items-end justify-between gap-1 sm:gap-4 w-full">
            {[45, 65, 30, 85, 55, 40, 60].map((h, i) => (
              <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div style={{ height: `${h}%` }} className="w-full max-w-[28px] sm:max-w-11 rounded-full bg-ad-line/50" />
                <div className="h-3 w-6 rounded-full bg-ad-line/30" />
              </div>
            ))}
          </div>
        </Card>

        {/* Reminder Skeleton */}
        <Card className="flex flex-col p-4 sm:p-6 md:col-span-2 lg:col-span-1 animate-pulse">
          <div className="h-5 w-24 rounded-xl bg-ad-line/50" />
          <div className="mt-4 space-y-2">
            <div className="h-6 w-full rounded-xl bg-ad-line/50" />
            <div className="h-4 w-5/6 rounded-full bg-ad-line/30" />
          </div>
          <div className="mt-auto pt-6">
            <div className="h-11 w-full rounded-full bg-ad-line/50" />
          </div>
        </Card>

        {/* Inbox Skeleton */}
        <Card className="p-4 sm:p-6 md:col-span-2 lg:col-span-2 animate-pulse">
          <div className="flex justify-between">
            <div className="h-5 w-32 rounded-xl bg-ad-line/50" />
            <div className="h-6 w-20 rounded-full bg-ad-line/40" />
          </div>
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl p-2">
                <div className="size-10 rounded-full bg-ad-line/50" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-32 rounded-full bg-ad-line/50" />
                  <div className="h-3 w-48 rounded-full bg-ad-line/30" />
                </div>
                <div className="h-6 w-16 rounded-full bg-ad-line/40" />
              </div>
            ))}
          </div>
        </Card>

        {/* Latest Content Skeleton */}
        <Card className="p-4 sm:p-6 md:col-span-1 lg:col-span-1 animate-pulse">
          <div className="flex justify-between">
            <div className="h-5 w-36 rounded-xl bg-ad-line/50" />
            <div className="h-6 w-16 rounded-full bg-ad-line/40" />
          </div>
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-1.5">
                <div className="size-9 rounded-xl bg-ad-line/50" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-36 rounded-full bg-ad-line/50" />
                  <div className="h-3 w-20 rounded-full bg-ad-line/30" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Profile Progress Skeleton */}
        <Card className="p-4 sm:p-6 md:col-span-1 lg:col-span-1 animate-pulse">
          <div className="h-5 w-40 rounded-xl bg-ad-line/50" />
          <div className="mx-auto mt-6 size-36 rounded-full border-[14px] border-ad-line/40" />
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 w-16 rounded-full bg-ad-line/40" />
            ))}
          </div>
        </Card>

        {/* Focus Timer Skeleton */}
        <div className="md:col-span-2 lg:col-span-2 rounded-2xl sm:rounded-3xl bg-[#1c2a4a]/80 p-4 sm:p-6 animate-pulse">
          <div className="h-5 w-28 rounded-xl bg-white/20" />
          <div className="mt-1 h-3 w-52 rounded-full bg-white/10" />
          <div className="mt-6 h-10 w-44 rounded-2xl bg-white/20" />
          <div className="mt-6 flex gap-3">
            <div className="size-12 rounded-full bg-white/30" />
            <div className="size-12 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const toast = useToast();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [visitors, setVisitors] = useState<DashboardData["weeklyVisitors"]>([]);
  const [ownerName, setOwnerName] = useState<string>(site.name);

  useEffect(() => {
    let active = true;
    getSettings()
      .then((s) => {
        if (active && s.name) setOwnerName(s.name);
      })
      .catch(() => {});

    getDashboard()
      .then((result) => {
        if (active) {
          setDashboard(result);
          setVisitors(result.weeklyVisitors);
        }
      })
      .catch((error: unknown) => {
        if (active) toast(error instanceof Error ? error.message : "Gagal memuat dashboard.");
      });
    return () => {
      active = false;
    };
  }, [toast]);

  if (!dashboard) {
    return <DashboardSkeleton />;
  }

  const counts = dashboard.counts;
  const stats = [
    { label: "Total Proyek", value: counts?.projects ?? 0, note: "Tampil di halaman portfolio", href: "/admin/proyek", icon: FolderKanban },
    { label: "Sertifikasi", value: counts?.certifications ?? 0, note: "Bahasa & teknis", href: "/admin/sertifikasi", icon: Award },
    { label: "Kegiatan", value: counts?.activities ?? 0, note: "Galeri kegiatan", href: "/admin/kegiatan", icon: CalendarDays },
    { label: "Pesan", value: counts?.messages ?? 0, note: counts?.unreadMessages ? `${counts.unreadMessages} belum dibaca` : "Semua sudah dibaca", href: "/admin/pesan", icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Halo ${ownerName}, ini ringkasan konten portfolio hari ini.`}
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/admin/proyek"
              className="inline-flex h-10 sm:h-11 flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-br from-ad to-ad-deep px-3.5 sm:px-5 text-xs sm:text-sm font-medium text-white shadow-[0_10px_24px_-12px_rgba(47,98,214,0.8)] transition hover:brightness-110"
            >
              <Plus className="size-3.5 sm:size-4" /> Tambah Proyek
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="ad-glass-soft inline-flex h-10 sm:h-11 flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-5 text-xs sm:text-sm font-medium text-ad-deep transition hover:bg-white"
            >
              Lihat Website <ExternalLink className="size-3.5 sm:size-4" />
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} highlight={i === 0} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        <VisitorChart weeklyVisitors={visitors} />
        <Reminder />
        <Inbox messages={dashboard?.latestMessages ?? []} />
        <LatestContent content={dashboard?.latestContent ?? []} />
        <ProfileProgress checks={dashboard?.profileCompleteness.checks ?? []} />
        <div className="min-w-0 md:col-span-2 lg:col-span-2">
          <FocusTimer />
        </div>
      </div>
    </div>
  );
}
