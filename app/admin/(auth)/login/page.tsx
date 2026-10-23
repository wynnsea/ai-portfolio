import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function Page() {
  return <LoginForm />;
}
