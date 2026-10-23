import type { Metadata } from "next";
import { Settings } from "@/components/admin/settings";

export const metadata: Metadata = { title: "Pengaturan" };

export default function Page() {
  return <Settings />;
}
