import type { Metadata } from "next";
import { SertifikasiTable } from "@/components/admin/resources";

export const metadata: Metadata = { title: "Sertifikasi" };

export default function Page() {
  return <SertifikasiTable />;
}
