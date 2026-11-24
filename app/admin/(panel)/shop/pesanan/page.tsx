import type { Metadata } from "next";
import { ShopPesananTable } from "@/components/admin/resources";

export const instant = false;
export const metadata: Metadata = { title: "Pesanan Shop" };

export default function Page() {
  return <ShopPesananTable />;
}
