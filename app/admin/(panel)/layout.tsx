import { AdminShell } from "@/components/admin/shell";

export const instant = false;

// Semua halaman panel (dashboard, CRUD, pengaturan) memakai sidebar + topbar.
// Halaman login ada di app/admin/(auth) sehingga tampil tanpa sidebar.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
