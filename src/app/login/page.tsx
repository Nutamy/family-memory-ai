import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <AuthShell title="С возвращением" subtitle="Войдите, чтобы продолжить заполнение архива.">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
      <p className="mt-6 rounded-2xl bg-mist px-4 py-3 text-center text-sm text-forest">
        Демо-доступ: <b>demo@family.ai</b> / <b>demo1234</b>
      </p>
    </AuthShell>
  );
}
