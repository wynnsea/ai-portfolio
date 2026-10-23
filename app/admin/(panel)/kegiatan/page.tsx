import type { Metadata } from "next";
import { KegiatanTable } from "@/components/admin/resources";

export const metadata: Metadata = { title: "Kegiatan" };

export default function Page() {
  return <KegiatanTable />;
}
