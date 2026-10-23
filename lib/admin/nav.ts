import {
  Award,
  CalendarDays,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { seed } from "@/lib/admin/data";

export type NavItem = { label: string; href: string; icon: LucideIcon; badge?: number };

const unread = seed.pesan.filter((m) => m.status === "Baru").length;

export const adminNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Menu",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Proyek", href: "/admin/proyek", icon: FolderKanban },
      { label: "Sertifikasi", href: "/admin/sertifikasi", icon: Award },
      { label: "Kegiatan", href: "/admin/kegiatan", icon: CalendarDays },
      { label: "Artikel", href: "/admin/artikel", icon: FileText },
      { label: "Pesan", href: "/admin/pesan", icon: Mail, badge: unread || undefined },
    ],
  },
  {
    title: "Umum",
    items: [
      { label: "Pengaturan", href: "/admin/pengaturan", icon: Settings },
      { label: "Bantuan", href: "/admin/bantuan", icon: LifeBuoy },
      { label: "Keluar", href: "/admin/login", icon: LogOut },
    ],
  },
];
