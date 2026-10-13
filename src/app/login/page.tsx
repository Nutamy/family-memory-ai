import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { isGoogleEnabled } from "@/lib/google";
import { turnstileSiteKey } from "@/lib/security/form-guard";

// Rendered per request: Turnstile/Google settings and the demo hint come from runtime env.
export const dynamic = "force-dynamic";

export const metadata = { title: "Вход" };

// The demo account is seeded only locally; production D1 has no demo user.
const showDemo = () => process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_LOGIN === "1";

export default function LoginPage() {
  return (
    <AuthShell title="С возвращением" subtitle="Войдите, чтобы продолжить заполнение архива.">
      <Suspense>
        <AuthForm mode="login" turnstileSiteKey={turnstileSiteKey()} google={isGoogleEnabled()} />
      </Suspense>
      {showDemo() && (
        <p className="mt-6 rounded-2xl bg-mist px-4 py-3 text-center text-sm text-forest">
          Демо-доступ: <b>demo@family.ai</b> / <b>demo1234</b>
        </p>
      )}
    </AuthShell>
  );
}
