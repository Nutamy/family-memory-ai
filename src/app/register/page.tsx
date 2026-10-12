import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <AuthShell title="Создать аккаунт" subtitle="В одном аккаунте можно вести архивы нескольких членов семьи.">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
