"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Globe, KeyRound, Plug, User } from "lucide-react";
import { site } from "@/lib/site";
import { getSettings, updatePassword, updateSettings, uploadFile, type SiteSettings } from "@/lib/admin/api";
import { isSupabaseConfigured, supabaseHost } from "@/lib/supabase/client";
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
  const [settings, setSettings] = useState<SiteSettings>({
    brand: site.brand,
    name: site.name,
    nameJp: site.nameJp,
    role: site.role,
    description: site.description,
    location: site.location,
    email: site.email,
    photoUrl: null,
    cvUrl: site.cv || null,
    availability: site.availability,
    socials: [...site.socials],
    features: { chatbot: true, preloader: true },
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    getSettings()
      .then((result) => {
        if (!active) return;
        setSettings(result);
        setAvailable(result.availability.open);
        setChatbot(result.features.chatbot);
        setPreloader(result.features.preloader);
      })
      .catch((error: unknown) => {
        if (active) toast(error instanceof Error ? error.message : "Gagal memuat pengaturan.");
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateSettings({
        name: settings.name,
        email: settings.email,
        role: settings.role,
        location: settings.location,
        description: settings.description,
      });
      setSettings(updated);
      toast("Profil berhasil disimpan.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan profil.");
    }
  };

  const saveWebsite = async () => {
    try {
      const updated = await updateSettings({
        availability: { ...settings.availability, open: available },
        features: { chatbot, preloader },
      });
      setSettings(updated);
      toast("Pengaturan website berhasil disimpan.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal menyimpan pengaturan website.");
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePassword(passwords.current, passwords.next, passwords.confirmation);
      setPasswords({ current: "", next: "", confirmation: "" });
      toast("Password berhasil diubah.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengubah password.");
    }
  };

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    try {
      const uploaded = await uploadFile(file, "profile");
      const updated = await updateSettings({ photoUrl: uploaded.url });
      setSettings(updated);
      toast("Foto profil berhasil diperbarui.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengunggah foto profil.");
    } finally {
      if (photoInput.current) photoInput.current.value = "";
    }
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
            <form onSubmit={saveProfile} className="grid gap-5 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-3">
                <Image src={settings.photoUrl || site.photo} alt={settings.name} width={112} height={112} unoptimized className="size-28 rounded-3xl object-cover object-top ring-4 ring-white" />
                <input
                  ref={photoInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => void uploadPhoto(event.target.files?.[0])}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => photoInput.current?.click()}>
                  Ganti foto
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama">
                  <Input value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} />
                </Field>
                <Field label="Role">
                  <Input value={settings.role} onChange={(event) => setSettings({ ...settings, role: event.target.value })} />
                </Field>
                <Field label="Lokasi">
                  <Input value={settings.location} placeholder="mis. Bekasi, Indonesia" onChange={(event) => setSettings({ ...settings, location: event.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Bio singkat">
                    <Textarea value={settings.description} onChange={(event) => setSettings({ ...settings, description: event.target.value })} />
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
              <Button onClick={() => void saveWebsite()}>Simpan</Button>
            </div>
          </Card>
        )}

        {tab === "keamanan" && (
          <Card className="p-6">
            <form onSubmit={savePassword} className="grid max-w-xl gap-4">
              <Field label="Password lama">
                <Input type="password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} />
              </Field>
              <Field label="Password baru" hint="Minimal 8 karakter">
                <Input type="password" autoComplete="new-password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} />
              </Field>
              <Field label="Ulangi password baru">
                <Input type="password" autoComplete="new-password" value={passwords.confirmation} onChange={(event) => setPasswords({ ...passwords, confirmation: event.target.value })} />
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
            <Row title="Database Supabase" desc={isSupabaseConfigured ? supabaseHost : "NEXT_PUBLIC_SUPABASE_URL belum diisi di .env.local"}>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isSupabaseConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {isSupabaseConfigured ? "Terhubung" : "Belum diatur"}
              </span>
            </Row>
            <Row title="Gemini (SEA AI & Job Match)" desc="Kunci API disimpan di server (GEMINI_API_KEY), tidak tampil di sini">
              <span className="rounded-full bg-ad-soft px-2.5 py-1 text-[11px] font-medium text-ad-deep">Server-side</span>
            </Row>
            <Row title="Autentikasi" desc="Supabase Auth (email & password), akses dibatasi tabel admins">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Aktif</span>
            </Row>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
