import type { Metadata } from "next";
import { AdminBackground, ToastProvider } from "@/components/admin/ui";

// Panel admin: tidak boleh muncul di mesin pencari
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin WYNNSEA" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // `isolate`: blob latar (z-index negatif) tetap di atas latar putih <body>
    <div className="relative isolate min-h-svh w-full max-w-full overflow-x-clip text-ad-ink">
      <AdminBackground />
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
