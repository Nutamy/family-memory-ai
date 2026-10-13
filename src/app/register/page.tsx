import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isGoogleEnabled } from "@/lib/google";
import { turnstileSiteKey } from "@/lib/security/form-guard";

// Rendered per request: Turnstile and Google settings come from runtime env.
export const dynamic = "force-dynamic";

export const metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <AuthShell title="Создать аккаунт" subtitle="Архивы хранятся в защищённой базе и доступны с любого устройства.">
      <Suspense>
        <AuthForm mode="register" turnstileSiteKey={turnstileSiteKey()} google={isGoogleEnabled()} />
      </Suspense>
    </AuthShell>
  );
}
