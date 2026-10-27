import type { Metadata } from "next";
import { ArtikelTable } from "@/components/admin/resources";

export const instant = false;
export const metadata: Metadata = { title: "Artikel" };

export default function Page() {
  return <ArtikelTable />;
}
