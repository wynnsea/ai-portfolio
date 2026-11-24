import type { Metadata } from "next";
import { ShopTemplateTable } from "@/components/admin/resources";

export const instant = false;
export const metadata: Metadata = { title: "Template Shop" };

export default function Page() {
  return <ShopTemplateTable />;
}
