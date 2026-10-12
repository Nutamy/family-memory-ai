import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { GuestStart } from "@/components/auth/guest-start";
import { authMode } from "@/lib/auth-mode";
import { turnstileSiteKey } from "@/lib/security/form-guard";

// Rendered per request: auth mode, Turnstile keys and the demo hint come from runtime env.
export const dynamic = "force-dynamic";

export const metadata = { title: "Начать" };

// The demo account is seeded only locally; production D1 has no demo user.
const showDemo = () => process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_LOGIN === "1";

export default function LoginPage() {
  const mode = authMode();
  // Cloudflare Access has already signed the visitor in.
  if (mode === "access") redirect("/app");

  if (mode === "guest") {
    return (
      <AuthShell title="Сохраним вашу историю" subtitle="Анкета о жизни, семье и ценностях — для близких и будущих поколений.">
        <Suspense>
          <GuestStart turnstileSiteKey={turnstileSiteKey()} />
        </Suspense>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="С возвращением" subtitle="Войдите, чтобы продолжить заполнение архива.">
      <Suspense>
        <AuthForm mode="login" turnstileSiteKey={turnstileSiteKey()} />
      </Suspense>
      {showDemo() && (
        <p className="mt-6 rounded-2xl bg-mist px-4 py-3 text-center text-sm text-forest">
          Демо-доступ: <b>demo@family.ai</b> / <b>demo1234</b>
        </p>
      )}
    </AuthShell>
  );
}
