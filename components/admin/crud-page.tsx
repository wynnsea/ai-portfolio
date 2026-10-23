"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Inbox, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Resource, Row } from "@/lib/admin/data";
import { deleteRow, initialRows, saveRow } from "@/lib/admin/api";
import { Badge, Button, Field, Input, Modal, PageHeader, Select, Textarea, useToast } from "@/components/admin/ui";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number" | "url" | "date" | "email";
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

const PAGE_SIZE = 6;
type Mode = { type: "create" } | { type: "edit"; row: Row } | { type: "show"; row: Row } | { type: "delete"; row: Row } | null;

export function CrudPage({
  resource,
  title,
  description,
  singular,
  columns,
  fields,
  searchKeys,
  filter,
  allowCreate = true,
  allowEdit = true,
  titleKey = "title",
}: CrudPageProps) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(() => initialRows(resource));
  const [query, setQuery] = useState("");
  const [filterValue, setFilterValue] = useState("Semua");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQuery = !q || searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q));
      const matchFilter = !filter || filterValue === "Semua" || r[filter.key] === filterValue;
      return matchQuery && matchFilter;
    });
  }, [rows, query, filterValue, searchKeys, filter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const f of fields) if (f.required && !form[f.name]?.trim()) next[f.name] = `${f.label} wajib diisi`;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const isEdit = mode?.type === "edit";
    const id = isEdit ? mode.row.id : Math.max(0, ...rows.map((r) => r.id)) + 1;
    const saved = await saveRow(resource, { ...(isEdit ? mode.row : {}), ...form, id } as Row);
    setRows((rs) => (isEdit ? rs.map((r) => (r.id === id ? saved : r)) : [saved, ...rs]));
    setBusy(false);
    close();
    toast(isEdit ? `${singular} berhasil diperbarui` : `${singular} berhasil ditambahkan`);
  };

  const remove = async () => {
    if (mode?.type !== "delete") return;
    setBusy(true);
    await deleteRow(resource, mode.row.id);
    setRows((rs) => rs.filter((r) => r.id !== mode.row.id));
    setBusy(false);
    close();
    toast(`${singular} berhasil dihapus`);
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
      <IconButton label="Lihat detail" onClick={() => setMode({ type: "show", row })}>
        <Eye className="size-4" />
      </IconButton>
      {allowEdit && (
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
          {filtered.length} dari {rows.length} data
        </p>
      </div>

      {/* Data */}
      {visible.length === 0 ? (
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
          <div className="ad-glass-soft hidden overflow-hidden rounded-3xl md:block">
            <table className="w-full table-fixed text-left text-sm">
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
                  <tr key={row.id} className="border-b border-white/60 transition-colors last:border-0 hover:bg-white/50">
                    {columns.map((c) => (
                      <td key={c.key} className={`truncate px-5 py-3.5 text-ad-ink ${c.className ?? ""}`}>
                        {cell(row, c)}
                      </td>
                    ))}
                    <td className="px-5 py-3.5">{actions(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kartu (mobile) */}
          <ul className="space-y-3 md:hidden">
            {visible.map((row) => (
              <li key={row.id} className="ad-glass-soft rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{String(row[titleKey] ?? "")}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ad-muted">
                      {columns
                        .filter((c) => c.key !== titleKey && c.as !== "main")
                        .map((c) => (
                          <span key={c.key}>{c.as === "badge" ? cell(row, c) : `${c.label}: ${String(row[c.key] ?? "-") || "-"}`}</span>
                        ))}
                    </div>
                  </div>
                  {actions(row)}
                </div>
              </li>
            ))}
          </ul>

          {/* Paginasi */}
          {pages > 1 && (
            <div className="flex items-center justify-end gap-1.5">
              <IconButton label="Halaman sebelumnya" onClick={() => setPage(current - 1)} disabled={current === 1}>
                <ChevronLeft className="size-4" />
              </IconButton>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === current ? "page" : undefined}
                  className={`size-9 rounded-full text-sm transition ${n === current ? "bg-ad font-semibold text-white" : "text-ad-muted hover:bg-white"}`}
                >
                  {n}
                </button>
              ))}
              <IconButton label="Halaman berikutnya" onClick={() => setPage(current + 1)} disabled={current === pages}>
                <ChevronRight className="size-4" />
              </IconButton>
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
        <form id="crud-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
              <Field label={`${f.label}${f.required ? " *" : ""}`} hint={f.hint} error={errors[f.name]}>
                {f.type === "textarea" ? (
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
        title={mode?.type === "show" ? String(mode.row[titleKey] ?? singular) : singular}
        description={`Detail ${singular.toLowerCase()}`}
        size="lg"
        footer={
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
        }
      >
        {mode?.type === "show" && (
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {fields.map((f) => {
              const value = String(mode.row[f.name] ?? "");
              return (
                <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ad-muted">{f.label}</dt>
                  <dd className="mt-1 whitespace-pre-line text-sm text-ad-ink">
                    {!value ? (
                      <span className="text-ad-muted">Belum diisi</span>
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
