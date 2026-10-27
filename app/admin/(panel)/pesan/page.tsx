import type { Metadata } from "next";
import { PesanTable } from "@/components/admin/resources";

export const instant = false;
export const metadata: Metadata = { title: "Pesan" };

export default function Page() {
  return <PesanTable />;
}
