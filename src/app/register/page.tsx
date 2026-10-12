import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { turnstileSiteKey } from "@/lib/security/form-guard";

// Rendered per request: Turnstile keys and the demo hint come from runtime env.
export const dynamic = "force-dynamic";

export const metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <AuthShell title="Создать аккаунт" subtitle="В одном аккаунте можно вести архивы нескольких членов семьи.">
      <Suspense>
        <AuthForm mode="register" turnstileSiteKey={turnstileSiteKey()} />
      </Suspense>
    </AuthShell>
  );
}
