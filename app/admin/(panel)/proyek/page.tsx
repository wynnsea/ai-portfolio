import type { Metadata } from "next";
import { ProyekTable } from "@/components/admin/resources";

export const metadata: Metadata = { title: "Proyek" };

export default function Page() {
  return <ProyekTable />;
}
