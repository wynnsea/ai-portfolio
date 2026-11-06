import type { Metadata } from "next";
import { BlogAgent } from "@/components/admin/blog-agent";

export const instant = false;
export const metadata: Metadata = { title: "Agen Blog" };

export default function Page() {
  return <BlogAgent />;
}
