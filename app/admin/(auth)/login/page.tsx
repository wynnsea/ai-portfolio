import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function Page() {
  return (
    <Suspense fallback={<div className="grid min-h-svh place-items-center bg-[#eef3ff]" />}>
      <LoginForm />
    </Suspense>
  );
}
