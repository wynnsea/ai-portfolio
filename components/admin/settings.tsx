"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { FileText, Globe, KeyRound, Plus, Trash2, Plug, Upload, User, ExternalLink } from "lucide-react";
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl bg-white/50 p-4">
      <div>
        <p className="text-sm font-medium text-ad-ink">{title}</p>
        <p className="text-xs text-ad-muted">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ---------- Skeleton Pengaturan Profil ---------- */
function SettingsProfileSkeleton() {
  return (
    <Card className="p-6 animate-pulse" aria-busy="true" aria-label="Memuat pengaturan profil">
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3">
            <div className="size-28 rounded-3xl bg-ad-line/50 ring-4 ring-white" />
            <div className="h-8 w-24 rounded-full bg-ad-line/40" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 rounded-full bg-ad-line/40" />
                <div className="h-10 w-full rounded-2xl bg-ad-line/50" />
              </div>
            ))}
            <div className="sm:col-span-2 space-y-2">
              <div className="h-3 w-24 rounded-full bg-ad-line/40" />
              <div className="h-20 w-full rounded-2xl bg-ad-line/50" />
            </div>
          </div>
        </div>

        {/* CV Skeleton */}
        <div className="rounded-2xl border border-ad-line bg-white/40 p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-40 rounded-full bg-ad-line/50" />
              <div className="h-3 w-64 rounded-full bg-ad-line/30" />
            </div>
            <div className="h-9 w-28 rounded-full bg-ad-line/40" />
          </div>
        </div>

        {/* Social Links Skeleton */}
        <div className="rounded-2xl border border-ad-line bg-white/40 p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-44 rounded-full bg-ad-line/50" />
              <div className="h-3 w-52 rounded-full bg-ad-line/30" />
            </div>
            <div className="h-9 w-28 rounded-full bg-ad-line/40" />
          </div>
          <div className="mt-4 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-10 w-1/3 rounded-2xl bg-ad-line/40" />
                <div className="h-10 flex-1 rounded-2xl bg-ad-line/40" />
                <div className="size-10 rounded-xl bg-ad-line/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function Settings() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("profil");
  const [available, setAvailable] = useState(true);
  const [availabilityLabel, setAvailabilityLabel] = useState("Siap bekerja");
  const [availabilityDetail, setAvailabilityDetail] = useState("Full-time & freelance");
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
  const [loading, setLoading] = useState(true);
  const photoInput = useRef<HTMLInputElement>(null);
  const cvInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getSettings()
      .then((result) => {
        if (!active) return;
        setSettings(result);
        setAvailable(result.availability?.open ?? true);
        setAvailabilityLabel(result.availability?.label || "Siap bekerja");
        setAvailabilityDetail(result.availability?.detail || "Full-time & freelance");
        setChatbot(result.features?.chatbot ?? true);
        setPreloader(result.features?.preloader ?? true);
      })
      .catch((error: unknown) => {
        if (active) toast(error instanceof Error ? error.message : "Gagal memuat pengaturan.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateSettings({
        brand: settings.brand,
        name: settings.name,
        nameJp: settings.nameJp,
        email: settings.email,
        role: settings.role,
        location: settings.location,
        description: settings.description,
        cvUrl: settings.cvUrl,
        socials: settings.socials,
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
        availability: {
          open: available,
          label: availabilityLabel.trim() || null,
          detail: availabilityDetail.trim() || null,
        },
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

  const uploadCv = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast("Pilih file CV berformat PDF.");
      return;
    }
    try {
      const uploaded = await uploadFile(file, "cv");
      const updated = await updateSettings({ cvUrl: uploaded.url });
      setSettings(updated);
      toast("File CV berhasil diunggah.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengunggah file CV.");
    } finally {
      if (cvInput.current) cvInput.current.value = "";
    }
  };

  const addSocial = () => {
    setSettings({
      ...settings,
      socials: [...settings.socials, { label: "GitHub", href: "https://" }],
    });
  };

  const updateSocial = (index: number, key: "label" | "href", val: string) => {
    const next = [...settings.socials];
    next[index] = { ...next[index], [key]: val };
    setSettings({ ...settings, socials: next });
  };

  const removeSocial = (index: number) => {
    setSettings({
      ...settings,
      socials: settings.socials.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Atur profil, tampilan website, media sosial, dan integrasi API." />

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
        {tab === "profil" && (loading ? <SettingsProfileSkeleton /> : (
          <Card className="p-4 sm:p-6">
            <form onSubmit={saveProfile} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
                <div className="flex flex-col items-center gap-3">
                  <Image
                    src={settings.photoUrl || site.photo}
                    alt={settings.name}
                    width={112}
                    height={112}
                    unoptimized
                    className="size-28 rounded-3xl object-cover object-top ring-4 ring-white"
                  />
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Brand / Logo teks">
                    <Input value={settings.brand} onChange={(e) => setSettings({ ...settings, brand: e.target.value })} placeholder="mis. Wynnsea" />
                  </Field>
                  <Field label="Nama Jepang (Katakana/Kanji)">
                    <Input value={settings.nameJp || ""} onChange={(e) => setSettings({ ...settings, nameJp: e.target.value })} placeholder="mis. ワヤン" />
                  </Field>
                  <Field label="Nama Lengkap">
                    <Input value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} />
                  </Field>
                  <Field label="Email Kontak">
                    <Input type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} />
                  </Field>
                  <Field label="Role / Jabatan">
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
                </div>
              </div>

              {/* CV Management */}
              <div className="rounded-2xl border border-ad-line bg-white/40 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <FileText className="size-4 text-ad" /> File Curriculum Vitae (CV)
                    </h3>
                    <p className="text-xs text-ad-muted">
                      {settings.cvUrl ? "File CV sudah aktif. Pengunjung bisa mengunduh dari tombol Download CV." : "Belum ada file CV. Tombol Download CV otomatis disembunyikan."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={cvInput}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => void uploadCv(e.target.files?.[0])}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => cvInput.current?.click()}>
                      <Upload className="size-3.5" /> {settings.cvUrl ? "Ganti CV (PDF)" : "Unggah CV (PDF)"}
                    </Button>
                    {settings.cvUrl && (
                      <>
                        <a
                          href={settings.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center gap-1 rounded-full border border-ad-line bg-white px-3 text-xs font-medium text-ad-ink hover:bg-ad-soft"
                        >
                          Lihat <ExternalLink className="size-3" />
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setSettings({ ...settings, cvUrl: null })}
                        >
                          Hapus
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="rounded-2xl border border-ad-line bg-white/40 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ad-ink">Tautan Media Sosial & Eksternal</h3>
                    <p className="text-xs text-ad-muted">Tampil di bagian footer kontak dan modal SEA AI.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSocial} className="self-start sm:self-auto">
                    <Plus className="size-3.5" /> Tambah Tautan
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {settings.socials.length === 0 ? (
                    <p className="text-xs text-ad-muted">Belum ada tautan media sosial.</p>
                  ) : (
                    settings.socials.map((s, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-3 sm:p-0 rounded-2xl bg-white/50 sm:bg-transparent">
                        <div className="w-full sm:w-1/3">
                          <Input
                            value={s.label}
                            placeholder="Platform (mis. GitHub)"
                            onChange={(e) => updateSocial(idx, "label", e.target.value)}
                          />
                        </div>
                        <div className="flex flex-1 items-center gap-2">
                          <Input
                            value={s.href}
                            placeholder="https://..."
                            className="flex-1"
                            onChange={(e) => updateSocial(idx, "href", e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeSocial(idx)}
                            aria-label="Hapus tautan"
                            className="grid size-11 sm:size-9 shrink-0 place-items-center rounded-xl text-ad-muted transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="w-full sm:w-auto">Simpan semua perubahan profil</Button>
              </div>
            </form>
          </Card>
        ))}

        {tab === "website" && (
          <Card className="space-y-4 p-4 sm:p-6">
            <div className="rounded-2xl bg-white/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Open to work</p>
                  <p className="text-xs text-ad-muted">Tampilkan badge ketersediaan kerja di halaman utama (Hero)</p>
                </div>
                <Toggle checked={available} onChange={setAvailable} label="Open to work" />
              </div>
              {available && (
                <div className="mt-4 grid gap-3 border-t border-ad-line/50 pt-4 sm:grid-cols-2">
                  <Field label="Label Status">
                    <Input value={availabilityLabel} onChange={(e) => setAvailabilityLabel(e.target.value)} placeholder="mis. Siap bekerja" />
                  </Field>
                  <Field label="Keterangan Detail">
                    <Input value={availabilityDetail} onChange={(e) => setAvailabilityDetail(e.target.value)} placeholder="mis. Full-time & freelance" />
                  </Field>
                </div>
              )}
            </div>

            <Row title="Chatbot SEA AI" desc="Tampilkan floating button chatbot di sudut kanan bawah website">
              <Toggle checked={chatbot} onChange={setChatbot} label="Chatbot SEA AI" />
            </Row>

            <Row title="Animasi intro" desc="Preloader animasi selamat datang saat pengunjung membuka website">
              <Toggle checked={preloader} onChange={setPreloader} label="Animasi intro" />
            </Row>

            <div className="flex justify-end pt-2">
              <Button onClick={() => void saveWebsite()}>Simpan pengaturan website</Button>
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
              <span className="rounded-full bg-ad-soft px-2.5 py-1 text-[11px] font-medium text-ad-deep">Server-side (Aktif)</span>
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
