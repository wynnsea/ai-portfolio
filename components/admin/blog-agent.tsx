"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, CheckCircle2, Eye, Lightbulb, Loader2, PenLine, Plus, Send, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import {
  addIdea,
  archivePost,
  deleteIdea,
  generateDraftNow,
  getAgentSettings,
  listAiDrafts,
  listIdeas,
  publishPost,
  reviseDraft,
  saveAgentSettings,
  type AgentSettings,
  type AiDraft,
  type BlogIdea,
} from "@/lib/admin/blog-agent";
import type { PostBlock } from "@/lib/posts";
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Textarea, Toggle, useToast } from "@/components/admin/ui";

const formatDateTime = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso)) : "Belum pernah";

function nextRunText(s: AgentSettings): string {
  if (!s.enabled) return "Agen nonaktif";
  if (!s.last_run_at) return "Pada cron berikutnya (setiap hari ±08.00 WIB)";
  const next = new Date(new Date(s.last_run_at).getTime() + s.interval_days * 86_400_000);
  return next <= new Date() ? "Pada cron berikutnya (setiap hari ±08.00 WIB)" : `Sekitar ${formatDateTime(next.toISOString())}`;
}

function BlockPreview({ block }: { block: PostBlock }) {
  switch (block.type) {
    case "h2":
      return <h3 className="pt-3 text-base font-semibold text-ad-ink">{block.text}</h3>;
    case "quote":
      return <blockquote className="border-l-2 border-ad pl-3 italic text-ad-muted">{block.text}</blockquote>;
    case "list":
      return (
        <ul className="list-disc space-y-1 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
          <code>{block.code}</code>
        </pre>
      );
    default:
      return <p>{block.text}</p>;
  }
}

export function BlogAgent() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<BlogIdea[]>([]);
  const [drafts, setDrafts] = useState<AiDraft[]>([]);

  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaNotes, setIdeaNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [preview, setPreview] = useState<AiDraft | null>(null);
  const [feedback, setFeedback] = useState("");
  const [revising, setRevising] = useState(false);

  const loadAll = () => Promise.all([getAgentSettings(), listIdeas(), listAiDrafts()]);

  const apply = useCallback(([s, i, d]: Awaited<ReturnType<typeof loadAll>>) => {
    setSettings(s);
    setIdeas(i);
    setDrafts(d);
    setLoadError(null);
    // Perbarui isi modal preview kalau sedang terbuka (mis. setelah revisi)
    setPreview((current) => (current ? (d.find((x) => x.id === current.id) ?? null) : null));
  }, []);

  const refresh = async () => {
    try {
      apply(await loadAll());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat data agen blog.");
    }
  };

  useEffect(() => {
    let active = true;
    loadAll()
      .then((result) => active && apply(result))
      .catch((err: unknown) => active && setLoadError(err instanceof Error ? err.message : "Gagal memuat data agen blog."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [apply]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await saveAgentSettings({
        enabled: settings.enabled,
        interval_days: Math.min(60, Math.max(1, Math.round(settings.interval_days) || 7)),
        default_category: settings.default_category.trim() || "Catatan Teknis",
        tone: settings.tone.trim(),
        target_words: Math.min(2500, Math.max(300, Math.round(settings.target_words) || 900)),
      });
      setSettings(updated);
      toast("Pengaturan agen disimpan.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const submitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ideaTitle.trim().length < 3) return toast("Judul ide minimal 3 karakter.");
    try {
      await addIdea(ideaTitle, ideaNotes);
      setIdeaTitle("");
      setIdeaNotes("");
      toast("Ide masuk antrian.");
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menambah ide.");
    }
  };

  const removeIdea = async (id: number) => {
    try {
      await deleteIdea(id);
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menghapus ide.");
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const result = await generateDraftNow();
      toast(`Draft "${result.title}" siap direview.`);
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal membuat draft.");
      await refresh();
    } finally {
      setGenerating(false);
    }
  };

  const revise = async () => {
    if (!preview || feedback.trim().length < 3) return;
    setRevising(true);
    try {
      await reviseDraft(preview.id, feedback.trim());
      setFeedback("");
      toast("Draft sudah direvisi.");
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal merevisi draft.");
    } finally {
      setRevising(false);
    }
  };

  const publish = async (draft: AiDraft) => {
    try {
      await publishPost(draft.id);
      toast(`"${draft.title}" diterbitkan.`);
      setPreview(null);
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menerbitkan.");
    }
  };

  const archive = async (draft: AiDraft) => {
    try {
      await archivePost(draft.id);
      toast(`"${draft.title}" dipindah ke arsip.`);
      setPreview(null);
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mengarsipkan.");
    }
  };

  const queued = ideas.filter((i) => i.status === "Antri");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agen Blog"
        description="AI menulis draft artikel dari ide dan pengalamanmu. Semua hasil masuk sebagai Draft, kamu yang memutuskan terbit."
        actions={
          <Button onClick={generate} disabled={generating || loading || Boolean(loadError)}>
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generating ? "Menulis... (1-3 menit)" : "Buat draft sekarang"}
          </Button>
        }
      />

      {loadError && (
        <Card className="flex items-start gap-3 p-5 text-sm text-rose-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{loadError}</p>
        </Card>
      )}

      {loading ? (
        <Card className="h-64 animate-pulse p-6" aria-busy="true" aria-label="Memuat agen blog">
          <span className="sr-only">Memuat...</span>
        </Card>
      ) : (
        settings && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            {/* Pengaturan */}
            <Card className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Bot className="size-5 text-ad" />
                <h2 className="text-base font-semibold text-ad-ink">Jadwal & gaya tulisan</h2>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/50 p-4">
                <div>
                  <p className="text-sm font-medium text-ad-ink">Menulis otomatis</p>
                  <p className="text-xs text-ad-muted">Draft berikutnya: {nextRunText(settings)}</p>
                </div>
                <Toggle checked={settings.enabled} onChange={(v) => setSettings({ ...settings, enabled: v })} label="Aktifkan agen blog" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Interval (hari)" hint="1-60 hari sekali">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.interval_days}
                    onChange={(e) => setSettings({ ...settings, interval_days: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Target panjang (kata)" hint="300-2500">
                  <Input
                    type="number"
                    min={300}
                    max={2500}
                    step={100}
                    value={settings.target_words}
                    onChange={(e) => setSettings({ ...settings, target_words: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <Field label="Kategori default">
                <Input value={settings.default_category} onChange={(e) => setSettings({ ...settings, default_category: e.target.value })} />
              </Field>
              <Field label="Gaya tulisan" hint="Diteruskan apa adanya ke AI sebagai panduan gaya.">
                <Textarea rows={3} value={settings.tone} onChange={(e) => setSettings({ ...settings, tone: e.target.value })} />
              </Field>

              <div className="rounded-2xl bg-white/50 p-4 text-xs text-ad-muted">
                <p>
                  Terakhir jalan: <span className="text-ad-ink">{formatDateTime(settings.last_run_at)}</span>
                  {settings.last_status && <> · {settings.last_status}</>}
                </p>
                {settings.last_error && <p className="mt-1 text-rose-600">Error terakhir: {settings.last_error}</p>}
              </div>

              <div className="flex justify-end">
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />} Simpan pengaturan
                </Button>
              </div>
            </Card>

            {/* Antrian ide */}
            <Card className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-5 text-ad" />
                  <h2 className="text-base font-semibold text-ad-ink">Antrian ide</h2>
                </div>
                <span className="text-xs text-ad-muted">{queued.length} menunggu</span>
              </div>
              <p className="text-xs leading-relaxed text-ad-muted">
                Tulis ide plus catatan mentah: apa masalahnya, keputusan yang kamu ambil, angka hasil. Makin konkret catatanmu, makin bagus
                (dan makin disukai Google) artikelnya. Kalau antrian kosong, agen mengusulkan topik dari proyek & skill-mu.
              </p>

              <form onSubmit={submitIdea} className="space-y-3">
                <Input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="mis. Kenapa saya pakai hybrid search, bukan pure vector" />
                <Textarea
                  rows={3}
                  value={ideaNotes}
                  onChange={(e) => setIdeaNotes(e.target.value)}
                  placeholder="Catatan: masalah yang dihadapi, alasan, hasil/angka, hal yang dipelajari..."
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="outline" size="sm">
                    <Plus className="size-3.5" /> Tambah ke antrian
                  </Button>
                </div>
              </form>

              <ul className="space-y-2">
                {ideas.length === 0 && <li className="text-xs text-ad-muted">Belum ada ide.</li>}
                {ideas.map((idea) => (
                  <li key={idea.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/50 p-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ad-ink">{idea.title}</p>
                        <Badge>{idea.status}</Badge>
                      </div>
                      {idea.notes && <p className="mt-1 line-clamp-2 text-xs text-ad-muted">{idea.notes}</p>}
                    </div>
                    {idea.status === "Antri" && (
                      <button
                        type="button"
                        onClick={() => removeIdea(idea.id)}
                        aria-label={`Hapus ide ${idea.title}`}
                        className="grid size-8 shrink-0 place-items-center rounded-xl text-ad-muted transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )
      )}

      {/* Draft menunggu review */}
      {!loading && settings && (
        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <PenLine className="size-5 text-ad" />
            <h2 className="text-base font-semibold text-ad-ink">Draft menunggu review</h2>
          </div>
          {drafts.length === 0 ? (
            <p className="text-sm text-ad-muted">Belum ada draft dari agen. Klik &quot;Buat draft sekarang&quot; untuk mencoba.</p>
          ) : (
            <ul className="divide-y divide-ad-line/60">
              {drafts.map((draft) => (
                <li key={draft.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ad-ink">{draft.title}</p>
                      <Badge>Draft</Badge>
                      <Badge>AI</Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-ad-muted">{draft.excerpt}</p>
                    <p className="mt-1 text-xs text-ad-muted">
                      {draft.category} · {draft.read_time} · {draft.ai_revisions.filter((r) => r.type === "revise").length} revisi
                      {draft.ai_notes.length > 0 && <span className="text-amber-700"> · {draft.ai_notes.length} catatan untuk dicek</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreview(draft)}>
                      <Eye className="size-3.5" /> Review
                    </Button>
                    <Button size="sm" onClick={() => publish(draft)}>
                      <CheckCircle2 className="size-3.5" /> Terbitkan
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Modal
        open={Boolean(preview)}
        onClose={() => !revising && setPreview(null)}
        title={preview?.title ?? ""}
        description={preview ? `${preview.category} · ${preview.read_time} · /blog/${preview.slug}` : undefined}
        size="lg"
        footer={
          preview && (
            <div className="flex w-full flex-wrap justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => archive(preview)} disabled={revising}>
                Arsipkan
              </Button>
              <div className="flex gap-2">
                <a
                  href={`/admin/artikel?q=${encodeURIComponent(preview.title)}`}
                  className="inline-flex h-9 items-center rounded-full px-3.5 text-xs font-medium text-ad-muted hover:bg-ad-soft hover:text-ad-deep"
                >
                  Edit manual
                </a>
                <Button size="sm" onClick={() => publish(preview)} disabled={revising}>
                  <CheckCircle2 className="size-3.5" /> Terbitkan
                </Button>
              </div>
            </div>
          )
        }
      >
        {preview && (
          <div className="space-y-5">
            {preview.ai_notes.length > 0 && (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
                <p className="mb-2 flex items-center gap-2 font-medium">
                  <TriangleAlert className="size-4" /> Cek dulu sebelum terbit
                </p>
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {preview.ai_notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-1 rounded-2xl bg-white/60 p-4 text-xs">
              <p className="font-medium text-ad-ink">Pratinjau di Google</p>
              <p className="text-sm text-blue-700">{preview.seo_title || preview.title}</p>
              <p className="text-ad-muted">{preview.meta_description || preview.excerpt}</p>
              {preview.keywords.length > 0 && <p className="pt-1 text-ad-muted">Keyword: {preview.keywords.join(", ")}</p>}
            </div>

            <article className="space-y-3 text-sm leading-relaxed text-ad-ink">
              {preview.content.map((block, i) => (
                <BlockPreview key={i} block={block} />
              ))}
            </article>

            <div className="space-y-2 border-t border-ad-line/60 pt-4">
              <Field label="Minta revisi" hint="Contoh: intro terlalu panjang, tambahkan contoh kode query hybrid search, ganti judul jadi lebih spesifik.">
                <Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} disabled={revising} />
              </Field>
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={revise} disabled={revising || feedback.trim().length < 3}>
                  {revising ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  {revising ? "Merevisi... (1-2 menit)" : "Kirim ke agen"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
