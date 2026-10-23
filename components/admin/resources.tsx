"use client";

// Konfigurasi tabel CRUD tiap menu. Dipisah di modul client karena
// halaman (server component) hanya boleh mengirim props yang bisa diserialisasi.
import { CrudPage } from "@/components/admin/crud-page";

export function ProyekTable() {
  return (
    <CrudPage
      resource="proyek"
      title="Proyek"
      description="Kelola proyek yang tampil di halaman portfolio."
      singular="Proyek"
      searchKeys={["title", "category", "stack"]}
      filter={{ key: "status", label: "Filter status", options: ["Terbit", "Draft", "Arsip"] }}
      columns={[
        { key: "title", label: "Proyek", as: "main", subKey: "category", className: "w-[38%]" },
        { key: "role", label: "Peran" },
        { key: "year", label: "Tahun", className: "w-24" },
        { key: "status", label: "Status", as: "badge", className: "w-28" },
      ]}
      fields={[
        { name: "title", label: "Judul", required: true, placeholder: "mis. Minori AI RCR", full: true },
        { name: "category", label: "Kategori", required: true, placeholder: "mis. AI Grading · Rekrutmen" },
        { name: "year", label: "Tahun", type: "number", required: true, placeholder: "2026" },
        { name: "role", label: "Peran", placeholder: "mis. Fullstack Developer" },
        { name: "status", label: "Status", type: "select", options: ["Draft", "Terbit", "Arsip"] },
        { name: "stack", label: "Tech stack", placeholder: "Laravel, React, MySQL", hint: "Pisahkan dengan koma", full: true },
        { name: "summary", label: "Ringkasan", type: "textarea", required: true, placeholder: "Jelaskan singkat proyek ini..." },
      ]}
    />
  );
}

export function SertifikasiTable() {
  return (
    <CrudPage
      resource="sertifikasi"
      title="Sertifikasi"
      description="Sertifikat bahasa, teknis, dan pencapaian lainnya."
      singular="Sertifikat"
      searchKeys={["title", "issuer", "category"]}
      filter={{ key: "category", label: "Filter kategori", options: ["Japanese", "English", "Web Dev", "AI"] }}
      columns={[
        { key: "title", label: "Sertifikat", as: "main", subKey: "issuer", className: "w-[40%]" },
        { key: "category", label: "Kategori" },
        { key: "score", label: "Skor / Level" },
        { key: "year", label: "Tahun", className: "w-24" },
      ]}
      fields={[
        { name: "title", label: "Nama sertifikat", required: true, placeholder: "mis. JLPT N4", full: true },
        { name: "issuer", label: "Penerbit", required: true, placeholder: "mis. Japan Foundation" },
        { name: "category", label: "Kategori", type: "select", options: ["Japanese", "English", "Web Dev", "AI"] },
        { name: "year", label: "Tahun", type: "number", placeholder: "2025" },
        { name: "score", label: "Skor / Level", placeholder: "mis. 520" },
        { name: "credentialUrl", label: "Link kredensial", type: "url", placeholder: "https://...", full: true },
      ]}
    />
  );
}

export function KegiatanTable() {
  return (
    <CrudPage
      resource="kegiatan"
      title="Kegiatan"
      description="Galeri kegiatan: fasilitator lomba, panitia, workshop, dan lainnya."
      singular="Kegiatan"
      searchKeys={["title", "role", "organizer"]}
      columns={[
        { key: "title", label: "Kegiatan", as: "main", subKey: "organizer", className: "w-[42%]" },
        { key: "role", label: "Peran" },
        { key: "year", label: "Tahun", className: "w-24" },
      ]}
      fields={[
        { name: "title", label: "Nama kegiatan", required: true, full: true },
        { name: "role", label: "Peran", required: true, placeholder: "mis. Fasilitator" },
        { name: "organizer", label: "Penyelenggara", placeholder: "mis. Politeknik Takumi" },
        { name: "year", label: "Tahun", type: "number", placeholder: "2025" },
        { name: "description", label: "Deskripsi", type: "textarea", placeholder: "Ceritakan singkat kegiatannya..." },
      ]}
    />
  );
}

export function ArtikelTable() {
  return (
    <CrudPage
      resource="artikel"
      title="Artikel"
      description="Tulis dan kelola artikel blog. Data di bawah masih contoh."
      singular="Artikel"
      searchKeys={["title", "category", "excerpt"]}
      filter={{ key: "status", label: "Filter status", options: ["Draft", "Terbit", "Arsip"] }}
      columns={[
        { key: "title", label: "Judul", as: "main", subKey: "excerpt", className: "w-[44%]" },
        { key: "category", label: "Kategori" },
        { key: "date", label: "Tanggal", className: "w-32" },
        { key: "status", label: "Status", as: "badge", className: "w-28" },
      ]}
      fields={[
        { name: "title", label: "Judul", required: true, full: true },
        { name: "category", label: "Kategori", type: "select", options: ["Integrasi AI", "Budaya Jepang", "Web Dev", "Cerita"] },
        { name: "date", label: "Tanggal terbit", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["Draft", "Terbit", "Arsip"] },
        { name: "excerpt", label: "Ringkasan", required: true, placeholder: "1-2 kalimat pembuka", full: true },
        { name: "content", label: "Isi artikel", type: "textarea", placeholder: "Mulai menulis di sini..." },
      ]}
    />
  );
}

export function PesanTable() {
  return (
    <CrudPage
      resource="pesan"
      title="Pesan"
      description="Pesan masuk dari form kontak website. Data di bawah masih contoh."
      singular="Pesan"
      allowCreate={false}
      titleKey="subject"
      searchKeys={["name", "email", "subject"]}
      filter={{ key: "status", label: "Filter status", options: ["Baru", "Dibaca", "Dibalas"] }}
      columns={[
        { key: "subject", label: "Subjek", as: "main", subKey: "name", className: "w-[42%]" },
        { key: "email", label: "Email" },
        { key: "date", label: "Tanggal", className: "w-32" },
        { key: "status", label: "Status", as: "badge", className: "w-28" },
      ]}
      fields={[
        { name: "name", label: "Nama" },
        { name: "email", label: "Email", type: "email" },
        { name: "subject", label: "Subjek", full: true },
        { name: "date", label: "Tanggal", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["Baru", "Dibaca", "Dibalas"] },
        { name: "message", label: "Isi pesan", type: "textarea" },
      ]}
    />
  );
}
