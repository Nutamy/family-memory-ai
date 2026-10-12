import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { authMode } from "@/lib/auth-mode";
import { turnstileSiteKey } from "@/lib/security/form-guard";

// Rendered per request: Turnstile keys and the demo hint come from runtime env.
export const dynamic = "force-dynamic";

export const metadata = { title: "Регистрация" };

export default function RegisterPage() {
  // Only password mode has sign-up; guest mode starts on /login, Access needs nothing.
  const mode = authMode();
  if (mode === "access") redirect("/app");
  if (mode === "guest") redirect("/login");
  return (
    <AuthShell title="Создать аккаунт" subtitle="В одном аккаунте можно вести архивы нескольких членов семьи.">
      <Suspense>
        <AuthForm mode="register" turnstileSiteKey={turnstileSiteKey()} />
      </Suspense>
    </AuthShell>
  );
}
