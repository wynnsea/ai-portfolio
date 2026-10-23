"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Globe, KeyRound, Plug, User } from "lucide-react";
import { site } from "@/lib/site";
import { API_URL } from "@/lib/admin/api";
import { Button, Card, Field, Input, PageHeader, Textarea, Toggle, useToast } from "@/components/admin/ui";

const tabs = [
  { id: "profil", label: "Profil", icon: User },
  { id: "website", label: "Website", icon: Globe },
  { id: "keamanan", label: "Keamanan", icon: KeyRound },
  { id: "integrasi", label: "Integrasi", icon: Plug },
] as const;

type Tab = (typeof tabs)[number]["id"];

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/50 p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-ad-muted">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export function Settings() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("profil");
  const [available, setAvailable] = useState(true);
  const [chatbot, setChatbot] = useState(true);
  const [preloader, setPreloader] = useState(true);
  const [twoFa, setTwoFa] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Perubahan disimpan (demo, belum tersambung ke API)");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Atur profil, tampilan website, dan integrasi API." />

      <div className="ad-glass-soft inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${tab === t.id ? "text-white" : "text-ad-muted hover:text-ad-ink"}`}
          >
            {tab === t.id && <motion.span layoutId="ad-settings-tab" className="absolute inset-0 rounded-full bg-gradient-to-br from-ad to-ad-deep" />}
            <t.icon className="relative size-4" />
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {tab === "profil" && (
          <Card className="p-6">
            <form onSubmit={save} className="grid gap-5 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-3">
                <Image src={site.photo} alt={site.name} width={112} height={112} className="size-28 rounded-3xl object-cover object-top ring-4 ring-white" />
                <Button variant="outline" size="sm" onClick={() => toast("Upload foto aktif setelah API siap")}>
                  Ganti foto
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama">
                  <Input defaultValue={site.name} />
                </Field>
                <Field label="Email">
                  <Input type="email" defaultValue={site.email} />
                </Field>
                <Field label="Role">
                  <Input defaultValue="Junior AI Engineer" />
                </Field>
                <Field label="Lokasi">
                  <Input placeholder="mis. Bekasi, Indonesia" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Bio singkat">
                    <Textarea defaultValue="Interest terhadap perkembangan teknologi di bidang AI, dan suka mengintegrasikan AI ke sistem. Tertarik juga sama budaya Jepang." />
                  </Field>
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <Button type="submit">Simpan profil</Button>
                </div>
              </div>
            </form>
          </Card>
        )}

        {tab === "website" && (
          <Card className="space-y-3 p-6">
            <Row title="Open to work" desc="Tampilkan badge tersedia untuk kerja di hero">
              <Toggle checked={available} onChange={setAvailable} label="Open to work" />
            </Row>
            <Row title="Chatbot SEA AI" desc="Tampilkan floating button chatbot">
              <Toggle checked={chatbot} onChange={setChatbot} label="Chatbot SEA AI" />
            </Row>
            <Row title="Animasi intro" desc="Preloader saat pertama kali membuka website">
              <Toggle checked={preloader} onChange={setPreloader} label="Animasi intro" />
            </Row>
            <div className="flex justify-end pt-2">
              <Button onClick={() => toast("Pengaturan website disimpan (demo)")}>Simpan</Button>
            </div>
          </Card>
        )}

        {tab === "keamanan" && (
          <Card className="p-6">
            <form onSubmit={save} className="grid max-w-xl gap-4">
              <Field label="Password lama">
                <Input type="password" autoComplete="current-password" />
              </Field>
              <Field label="Password baru" hint="Minimal 8 karakter">
                <Input type="password" autoComplete="new-password" />
              </Field>
              <Field label="Ulangi password baru">
                <Input type="password" autoComplete="new-password" />
              </Field>
              <Row title="Verifikasi 2 langkah" desc="Kode tambahan saat login">
                <Toggle checked={twoFa} onChange={setTwoFa} label="Verifikasi 2 langkah" />
              </Row>
              <div className="flex justify-end">
                <Button type="submit">Ubah password</Button>
              </div>
            </form>
          </Card>
        )}

        {tab === "integrasi" && (
          <Card className="space-y-3 p-6">
            <Row title="API Laravel" desc={API_URL ? API_URL : "NEXT_PUBLIC_API_URL belum diisi di .env.local"}>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${API_URL ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {API_URL ? "Terhubung" : "Belum diatur"}
              </span>
            </Row>
            <Row title="Gemini (SEA AI & Job Match)" desc="Kunci API disimpan di server (GEMINI_API_KEY), tidak tampil di sini">
              <span className="rounded-full bg-ad-soft px-2.5 py-1 text-[11px] font-medium text-ad-deep">Server-side</span>
            </Row>
            <Row title="Autentikasi" desc="Rencana: Laravel Sanctum (token Bearer)">
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">Rencana</span>
            </Row>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
