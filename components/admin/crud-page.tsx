"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Inbox, Loader2, Mail, Pencil, Plus, Search, Send, Trash2, Upload } from "lucide-react";
import type { Resource, Row } from "@/lib/admin/data";
import { ApiError, deleteRow, getRow, listRows, saveRow, uploadFile } from "@/lib/admin/api";
import { Badge, Button, Field, Input, Modal, PageHeader, Select, Textarea, useToast } from "@/components/admin/ui";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number" | "url" | "date" | "email" | "image" | "images";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Lebar penuh (2 kolom) di form */
  full?: boolean;
};

export type ColumnDef = {
  key: string;
  label: string;
  className?: string;
  /** "badge" = tampil sebagai badge status, "main" = kolom utama (judul + sub) */
  as?: "badge" | "main";
  subKey?: string;
};

type CrudPageProps = {
  resource: Resource;
  title: string;
  description: string;
  singular: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  searchKeys: string[];
  filter?: { key: string; label: string; options: string[] };
  allowCreate?: boolean;
  allowEdit?: boolean;
  titleKey?: string;
};

function getPaginationRange(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }
  if (current >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", current - 1, current, current + 1, "...", totalPages];
}

const DEFAULT_PAGE_SIZE = 10;
type Mode = { type: "create" } | { type: "edit"; row: Row } | { type: "show"; row: Row } | { type: "delete"; row: Row } | null;

function CrudPageInner({
  resource,
  title,
  description,
  singular,
  columns,
  fields,
  filter,
  allowCreate = true,
  allowEdit = true,
  titleKey = "title",
}: CrudPageProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || searchParams.get("search") || "";
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  const [filterValue, setFilterValue] = useState("Semua");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [reload, setReload] = useState(0);
  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlQ = searchParams.get("q") || searchParams.get("search");
    if (urlQ !== null && urlQ !== query) {
      setQuery(urlQ);
      setSearch(urlQ);
    }
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listRows(resource, {
      page,
      perPage,
      search,
      filterKey: filter?.key,
      filterValue,
    })
      .then((result) => {
        if (!active) return;
        setRows(result.rows);
        setTotal(result.total);
        setPages(Math.max(1, result.lastPage));
      })
      .catch((error: unknown) => {
        if (active) {
          setRows([]);
          setTotal(0);
          setPages(1);
          toast(error instanceof Error ? error.message : "Gagal memuat data.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [resource, page, perPage, search, filter?.key, filterValue, reload, toast]);

  const current = Math.min(page, pages);
  const visible = rows;

  const close = () => {
    setMode(null);
    setErrors({});
  };

  const openForm = (row?: Row) => {
    const values: Record<string, string> = {};
    for (const f of fields) values[f.name] = row ? String(row[f.name] ?? "") : f.type === "select" && f.options ? f.options[0] : "";
    setForm(values);
    setErrors({});
    setMode(row ? { type: "edit", row } : { type: "create" });
  };

  const uploadImages = async (field: FieldDef, files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;
    const invalid = selected.find((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024);
    if (invalid) {
      toast("Pilih file gambar dengan ukuran maksimal 5 MB.");
      return;
    }

    setBusy(true);
    try {
      const uploads = await Promise.all(selected.map((file) => uploadFile(file, resource)));
      const urls = uploads.map((upload) => upload.url);
      setForm((currentForm) => {
        const existing = currentForm[field.name]?.split(/\r?\n/).map((url) => url.trim()).filter(Boolean) ?? [];
        const nextUrls = field.type === "images" ? [...existing, ...urls] : urls.slice(-1);
        return { ...currentForm, [field.name]: nextUrls.join("\n") };
      });
      toast(`${urls.length} gambar berhasil diunggah.`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal mengunggah gambar.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const f of fields) if (f.required && !form[f.name]?.trim()) next[f.name] = `${f.label} wajib diisi`;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const isEdit = mode?.type === "edit";
    const payload =
      resource === "pesan"
        ? { status: form.status }
        : Object.fromEntries(fields.map((field) => [field.name, form[field.name] ?? ""]));
    try {
      await saveRow(resource, payload, isEdit ? mode.row.id : undefined);
      setBusy(false);
      close();
      if (!isEdit) setPage(1);
      setReload((value) => value + 1);
      toast(isEdit ? `${singular} berhasil diperbarui` : `${singular} berhasil ditambahkan`);
    } catch (error) {
      setBusy(false);
      if (error instanceof ApiError && Object.keys(error.errors).length) {
        setErrors(Object.fromEntries(Object.entries(error.errors).map(([key, messages]) => [key, messages[0]])));
      } else {
        toast(error instanceof Error ? error.message : `Gagal menyimpan ${singular.toLowerCase()}.`);
      }
    }
  };

  const remove = async () => {
    if (mode?.type !== "delete") return;
    setBusy(true);
    try {
      await deleteRow(resource, mode.row.id);
      setBusy(false);
      close();
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else setReload((value) => value + 1);
      toast(`${singular} berhasil dihapus`);
    } catch (error) {
      setBusy(false);
      toast(error instanceof Error ? error.message : `Gagal menghapus ${singular.toLowerCase()}.`);
    }
  };

  const handleUpdateMessageStatus = async (row: Row, newStatus: "Dibaca" | "Dibalas") => {
    setBusy(true);
    try {
      const updated = await saveRow("pesan", { status: newStatus }, row.id);
      setBusy(false);
      setMode((current) => (current?.type === "show" ? { type: "show", row: { ...current.row, ...updated, status: newStatus } } : current));
      setRows((items) => items.map((item) => (item.id === row.id ? { ...item, ...updated, status: newStatus } : item)));
      toast(`Pesan berhasil ditandai ${newStatus.toLowerCase()}.`);
    } catch (error) {
      setBusy(false);
      toast(error instanceof Error ? error.message : "Gagal memperbarui status pesan.");
    }
  };

  const showDetails = async (row: Row) => {
    // Jika pesan baru, optimistically tampilkan sebagai Dibaca dan perbarui di tabel
    const initialRow = resource === "pesan" && row.status === "Baru" ? { ...row, status: "Dibaca" } : row;
    setMode({ type: "show", row: initialRow });
    if (resource === "pesan" && row.status === "Baru") {
      setRows((items) => items.map((item) => (item.id === row.id ? { ...item, status: "Dibaca" } : item)));
    }
    try {
      const detail = await getRow(resource, row.id);
      setMode({ type: "show", row: detail });
      setRows((items) => items.map((item) => (item.id === detail.id ? detail : item)));
    } catch (error) {
      toast(error instanceof Error ? error.message : `Gagal memuat detail ${singular.toLowerCase()}.`);
    }
  };

  const cell = (row: Row, col: ColumnDef) => {
    const value = String(row[col.key] ?? "");
    if (col.as === "badge") return value ? <Badge>{value}</Badge> : <span className="text-ad-muted">-</span>;
    if (col.as === "main")
      return (
        <div className="min-w-0">
          <p className="truncate font-medium text-ad-ink">{value}</p>
          {col.subKey && <p className="truncate text-xs text-ad-muted">{String(row[col.subKey] ?? "")}</p>}
        </div>
      );
    return <span className={value ? "" : "text-ad-muted"}>{value || "-"}</span>;
  };

  const actions = (row: Row) => (
    <div className="flex justify-end gap-1">
      {resource !== "pesan" && (
        <IconButton label="Lihat detail" onClick={() => void showDetails(row)}>
          <Eye className="size-4" />
        </IconButton>
      )}
      {allowEdit && resource !== "pesan" && (
        <IconButton label="Edit" onClick={() => openForm(row)}>
          <Pencil className="size-4" />
        </IconButton>
      )}
      <IconButton label="Hapus" danger onClick={() => setMode({ type: "delete", row })}>
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          allowCreate && (
            <Button onClick={() => openForm()}>
              <Plus className="size-4" /> Tambah {singular}
            </Button>
          )
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="ad-glass-soft flex h-11 items-center gap-2.5 rounded-full px-4 ring-1 ring-ad-line/80 sm:max-w-sm sm:flex-1">
          <Search className="size-4 text-ad-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={`Cari ${singular.toLowerCase()}...`}
            aria-label={`Cari ${singular.toLowerCase()}`}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ad-muted/70"
          />
        </div>
        {filter && (
          <div className="sm:w-48">
            <Select
              aria-label={filter.label}
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value);
                setPage(1);
              }}
              options={["Semua", ...filter.options]}
            />
          </div>
        )}
        <p className="text-xs text-ad-muted sm:ml-auto">
          {rows.length} dari {total} data
        </p>
      </div>

      {/* Data */}
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label={`Memuat data ${title.toLowerCase()}`}>
          {/* Desktop Table Skeleton */}
          <div className="ad-glass-soft hidden rounded-2xl sm:rounded-3xl md:block overflow-x-auto animate-pulse">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/80 text-xs uppercase tracking-wider text-ad-muted">
                  {columns.map((c) => (
                    <th key={c.key} className={`px-5 py-3.5 font-medium ${c.className ?? ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="w-32 px-5 py-3.5 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-white/60 last:border-0">
                    {columns.map((c) => (
                      <td key={c.key} className={`px-5 py-4 ${c.className ?? ""}`}>
                        {c.as === "main" ? (
                          <div className="space-y-1.5">
                            <div className="h-4 w-4/5 rounded-full bg-ad-line/60" />
                            <div className="h-3 w-1/2 rounded-full bg-ad-line/40" />
                          </div>
                        ) : c.as === "badge" ? (
                          <div className="h-6 w-20 rounded-full bg-ad-line/50" />
                        ) : (
                          <div className="h-4 w-24 rounded-full bg-ad-line/50" />
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <div className="size-8 rounded-full bg-ad-line/50" />
                        <div className="size-8 rounded-full bg-ad-line/40" />
                        <div className="size-8 rounded-full bg-ad-line/30" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Skeleton */}
          <ul className="space-y-3 md:hidden animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="ad-glass-soft rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded-full bg-ad-line/60" />
                    <div className="flex gap-2">
                      <div className="h-3 w-16 rounded-full bg-ad-line/40" />
                      <div className="h-3 w-20 rounded-full bg-ad-line/40" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="size-8 rounded-full bg-ad-line/50" />
                    <div className="size-8 rounded-full bg-ad-line/40" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : visible.length === 0 ? (
        <div className="ad-glass-soft flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-ad-soft text-ad-deep">
            <Inbox className="size-6" />
          </span>
          <p className="mt-4 font-semibold">{rows.length === 0 ? `Belum ada ${singular.toLowerCase()}` : "Tidak ada hasil"}</p>
          <p className="mt-1 text-sm text-ad-muted">
            {rows.length === 0 ? `Klik "Tambah ${singular}" untuk menambahkan data pertama.` : "Coba kata kunci atau filter lain."}
          </p>
        </div>
      ) : (
        <>
          {/* Tabel (tablet & desktop) */}
          <div className="ad-glass-soft hidden rounded-2xl sm:rounded-3xl md:block overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/80 text-xs uppercase tracking-wider text-ad-muted">
                  {columns.map((c) => (
                    <th key={c.key} className={`px-5 py-3.5 font-medium ${c.className ?? ""}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="w-32 px-5 py-3.5 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => void showDetails(row)}
                    className={`border-b border-white/60 transition-colors last:border-0 hover:bg-white/60 cursor-pointer ${
                      resource === "pesan" && row.status === "Baru" ? "bg-ad-soft/20 font-medium" : ""
                    }`}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={`truncate px-5 py-3.5 text-ad-ink ${c.className ?? ""}`}>
                        {c.key === "subject" && resource === "pesan" && row.status === "Baru" ? (
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-ad shrink-0 ring-2 ring-ad/20" title="Pesan baru" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ad-ink">{String(row[c.key] ?? "")}</p>
                              {c.subKey && <p className="truncate text-xs text-ad-muted">{String(row[c.subKey] ?? "")}</p>}
                            </div>
                          </div>
                        ) : (
                          cell(row, c)
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kartu (mobile) */}
          <ul className="space-y-2.5 md:hidden">
            {visible.map((row) => (
              <li
                key={row.id}
                onClick={() => void showDetails(row)}
                className={`ad-glass-soft rounded-2xl p-3.5 sm:p-4 cursor-pointer transition hover:bg-white/70 active:scale-[0.99] ${
                  resource === "pesan" && row.status === "Baru" ? "ring-2 ring-ad/40 bg-ad-soft/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {resource === "pesan" && row.status === "Baru" && (
                        <span className="size-2 rounded-full bg-ad shrink-0 ring-2 ring-ad/20" title="Pesan baru" />
                      )}
                      <p className="font-semibold text-ad-ink truncate text-sm">{String(row[titleKey] ?? "")}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ad-muted">
                      {columns
                        .filter((c) => c.key !== titleKey && c.as !== "main")
                        .map((c) => (
                          <span key={c.key} className="inline-flex items-center gap-1">
                            {c.as === "badge" ? cell(row, c) : (
                              <span>
                                <span className="opacity-75">{c.label}:</span>{" "}
                                <span className="font-medium text-ad-ink">{String(row[c.key] ?? "-") || "-"}</span>
                              </span>
                            )}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0 pt-0.5">
                    {actions(row)}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Paginasi & Baris per Halaman */}
          {total > 0 && (
            <div className="flex flex-col gap-3.5 pt-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Info & Pengaturan Baris per Halaman */}
              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3 text-xs text-ad-muted">
                <span>
                  Menampilkan{" "}
                  <strong className="font-semibold text-ad-ink">
                    {(current - 1) * perPage + 1}
                  </strong>{" "}
                  –{" "}
                  <strong className="font-semibold text-ad-ink">
                    {Math.min(current * perPage, total)}
                  </strong>{" "}
                  dari{" "}
                  <strong className="font-semibold text-ad-ink">{total}</strong> data
                </span>

                <span className="hidden sm:inline text-ad-line">|</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-ad-muted">Tampilkan:</span>
                  <div className="w-18">
                    <Select
                      size="sm"
                      value={String(perPage)}
                      options={["10", "20", "50", "100"]}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setPage(1);
                      }}
                    />
                  </div>
                  <span className="hidden sm:inline">per hal.</span>
                </div>
              </div>

              {/* Tombol Paginasi (Hanya muncul jika halaman > 1) */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-1">
                  {/* Halaman Pertama */}
                  <IconButton
                    label="Halaman pertama"
                    onClick={() => setPage(1)}
                    disabled={current === 1}
                  >
                    <ChevronsLeft className="size-4" />
                  </IconButton>

                  {/* Halaman Sebelumnya */}
                  <IconButton
                    label="Halaman sebelumnya"
                    onClick={() => setPage(current - 1)}
                    disabled={current === 1}
                  >
                    <ChevronLeft className="size-4" />
                  </IconButton>

                  {/* Di Mobile (< 640px): Tampilan Halaman Ringkas */}
                  <div className="flex sm:hidden items-center px-2 text-xs font-semibold text-ad-ink">
                    <span>{current}</span>
                    <span className="mx-1 text-ad-muted">/</span>
                    <span className="text-ad-muted">{pages}</span>
                  </div>

                  {/* Di Tablet & Desktop (>= 640px): Angka Lengkap dengan Ellipsis */}
                  <div className="hidden sm:flex items-center gap-1 px-1">
                    {getPaginationRange(current, pages).map((item, idx) =>
                      item === "..." ? (
                        <span
                          key={`dots-${idx}`}
                          className="grid size-9 place-items-center text-xs text-ad-muted select-none"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPage(item)}
                          aria-current={item === current ? "page" : undefined}
                          className={`grid size-9 place-items-center rounded-xl text-xs font-medium transition ${
                            item === current
                              ? "bg-gradient-to-br from-ad to-ad-deep text-white shadow-sm shadow-ad/30"
                              : "text-ad-ink hover:bg-white hover:text-ad-deep ring-1 ring-transparent hover:ring-ad-line/60"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>

                  {/* Halaman Berikutnya */}
                  <IconButton
                    label="Halaman berikutnya"
                    onClick={() => setPage(current + 1)}
                    disabled={current === pages}
                  >
                    <ChevronRight className="size-4" />
                  </IconButton>

                  {/* Halaman Terakhir */}
                  <IconButton
                    label="Halaman terakhir"
                    onClick={() => setPage(pages)}
                    disabled={current === pages}
                  >
                    <ChevronsRight className="size-4" />
                  </IconButton>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Popup: tambah / edit */}
      <Modal
        open={mode?.type === "create" || mode?.type === "edit"}
        onClose={close}
        title={mode?.type === "edit" ? `Edit ${singular}` : `Tambah ${singular}`}
        description={mode?.type === "edit" ? "Ubah data lalu simpan perubahan." : `Isi detail ${singular.toLowerCase()} baru.`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={close}>
              Batal
            </Button>
            <Button type="submit" form="crud-form" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Simpan
            </Button>
          </>
        }
      >
        <form id="crud-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
              <Field label={`${f.label}${f.required ? " *" : ""}`} hint={f.hint} error={errors[f.name]}>
                {f.type === "image" || f.type === "images" ? (
                  <div className="space-y-3">
                    {f.type === "image" ? (
                      <Input
                        type="url"
                        value={form[f.name] ?? ""}
                        placeholder="https://... atau upload gambar"
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      />
                    ) : (
                      <Textarea
                        value={form[f.name] ?? ""}
                        placeholder="Satu URL gambar per baris"
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      />
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-ad-line bg-white/70 px-4 text-xs font-medium text-ad-deep transition hover:bg-white">
                        <Upload className="size-4" />
                        Upload gambar
                        <input
                          type="file"
                          accept="image/*"
                          multiple={f.type === "images"}
                          disabled={busy}
                          className="sr-only"
                          onChange={(event) => {
                            void uploadImages(f, event.currentTarget.files);
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <span className="text-xs text-ad-muted">Maks. 5 MB per gambar</span>
                    </div>
                    {!!form[f.name]?.trim() && (
                      <div className="flex flex-wrap gap-2">
                        {form[f.name].split(/\r?\n/).map((url) => url.trim()).filter(Boolean).map((url) => (
                          <Image key={url} src={url} alt="Pratinjau gambar" width={112} height={72} unoptimized className="h-[72px] w-28 rounded-xl object-cover ring-1 ring-ad-line" />
                        ))}
                      </div>
                    )}
                  </div>
                ) : f.type === "textarea" ? (
                  <Textarea value={form[f.name] ?? ""} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                ) : f.type === "select" ? (
                  <Select value={form[f.name] ?? ""} options={f.options ?? []} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                ) : (
                  <Input
                    type={f.type ?? "text"}
                    value={form[f.name] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                )}
              </Field>
            </div>
          ))}
        </form>
      </Modal>

      {/* Popup: detail */}
      <Modal
        open={mode?.type === "show"}
        onClose={close}
        title={
          resource === "pesan"
            ? "Pesan Masuk"
            : mode?.type === "show"
              ? String(mode.row[titleKey] ?? singular)
              : singular
        }
        description={resource === "pesan" ? "Detail pesan dari pengunjung website" : `Detail ${singular.toLowerCase()}`}
        size="lg"
        footer={
          resource === "pesan" && mode?.type === "show" ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div>
                {typeof mode.row.email === "string" && mode.row.email && (
                  <a
                    href={`mailto:${mode.row.email}?subject=Re: ${encodeURIComponent(String(mode.row.subject ?? ""))}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-ad-line bg-white px-4 text-xs font-medium text-ad-deep transition hover:bg-ad-soft"
                  >
                    <Mail className="size-4" /> Balas via Email
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={close}>
                  Tutup
                </Button>
                {mode.row.status === "Baru" ? (
                  <Button
                    onClick={() => void handleUpdateMessageStatus(mode.row, "Dibaca")}
                    disabled={busy}
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Tandai Dibaca
                  </Button>
                ) : mode.row.status === "Dibaca" ? (
                  <Button
                    variant="outline"
                    onClick={() => void handleUpdateMessageStatus(mode.row, "Dibalas")}
                    disabled={busy}
                    title="Tandai jika sudah membalas pesan ini"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Tandai Dibalas
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600">
                    <Check className="size-4" /> Sudah Dibalas
                  </span>
                )}
              </div>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={close}>
                Tutup
              </Button>
              {allowEdit && mode?.type === "show" && (
                <Button onClick={() => openForm(mode.row)}>
                  <Pencil className="size-4" /> Edit
                </Button>
              )}
            </>
          )
        }
      >
        {mode?.type === "show" && (
          resource === "pesan" ? (
            <div className="space-y-4">
              {/* Profil Pengirim */}
              <div className="flex flex-col gap-4 rounded-2xl border border-ad-line/80 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ad/20 to-ad-soft text-lg font-bold text-ad-deep ring-1 ring-ad-line">
                    {String(mode.row.name ?? "U").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-ad-ink">{String(mode.row.name ?? "Tanpa Nama")}</p>
                      <Badge>{String(mode.row.status ?? "Baru")}</Badge>
                    </div>
                    <a
                      href={`mailto:${String(mode.row.email ?? "")}`}
                      className="mt-0.5 block truncate text-xs text-ad-deep underline underline-offset-2 hover:text-ad"
                      title="Kirim email ke pengirim"
                    >
                      {String(mode.row.email ?? "")}
                    </a>
                  </div>
                </div>

                <div className="text-xs text-ad-muted sm:text-right">
                  <p className="font-medium text-ad-ink">Waktu Masuk</p>
                  <p className="mt-0.5">{String(mode.row.date ?? mode.row.createdAt ?? "-")}</p>
                </div>
              </div>

              {/* Subjek */}
              <div className="rounded-2xl border border-ad-line/70 bg-white/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ad-muted">Subjek</p>
                <p className="mt-1 text-sm font-semibold text-ad-ink">{String(mode.row.subject ?? "(Tanpa Subjek)")}</p>
              </div>

              {/* Isi Pesan */}
              <div className="rounded-2xl border border-ad-line/70 bg-white/80 p-5 shadow-xs">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ad-muted">Isi Pesan</p>
                <div className="select-text whitespace-pre-wrap text-sm leading-relaxed text-ad-ink">
                  {String(mode.row.message ?? "(Pesan kosong)")}
                </div>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {fields.map((f) => {
                const value = String(mode.row[f.name] ?? "");
                return (
                  <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                    <dt className="text-xs font-medium uppercase tracking-wider text-ad-muted">{f.label}</dt>
                    <dd className="mt-1 whitespace-pre-line text-sm text-ad-ink">
                      {!value ? (
                        <span className="text-ad-muted">Belum diisi</span>
                      ) : f.type === "image" || f.type === "images" ? (
                        <div className="flex flex-wrap gap-2">
                          {value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).map((url) => (
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer" aria-label="Buka gambar di tab baru">
                              <Image src={url} alt="" width={144} height={96} unoptimized className="h-24 w-36 rounded-xl object-cover ring-1 ring-ad-line" />
                            </a>
                          ))}
                        </div>
                      ) : f.type === "url" ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-ad-deep underline underline-offset-2">
                          {value}
                        </a>
                      ) : f.type === "select" && f.name === "status" ? (
                        <Badge>{value}</Badge>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )
        )}
      </Modal>

      {/* Popup: konfirmasi hapus */}
      <Modal
        open={mode?.type === "delete"}
        onClose={close}
        title={`Hapus ${singular.toLowerCase()}?`}
        footer={
          <>
            <Button variant="outline" onClick={close}>
              Batal
            </Button>
            <Button variant="danger" onClick={remove} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Ya, hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-ad-muted">
          <span className="font-semibold text-ad-ink">{mode?.type === "delete" ? String(mode.row[titleKey] ?? "") : ""}</span> akan dihapus permanen. Tindakan ini
          tidak bisa dibatalkan.
        </p>
      </Modal>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid size-9 place-items-center rounded-full transition disabled:opacity-30 ${
        danger ? "text-rose-500 hover:bg-rose-50" : "text-ad-muted hover:bg-white hover:text-ad-deep"
      }`}
    >
      {children}
    </button>
  );
}

export function CrudPage(props: CrudPageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ad-muted">Memuat data...</div>}>
      <CrudPageInner {...props} />
    </Suspense>
  );
}
