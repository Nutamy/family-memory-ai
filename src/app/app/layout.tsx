import { AppHeader } from "@/components/layout/app-header";
import { TelegramConnect } from "@/components/telegram/telegram-connect";
import { requireUser } from "@/lib/auth";
import { isGuestEmail } from "@/lib/auth-mode";
import { db } from "@/lib/db";
import { botToken } from "@/lib/integrations/telegram";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { telegramChatId } = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { telegramChatId: true } });
  // Until the chat is linked, every page asks for it: results and the "continue" link go there.
  const askTelegram = !!botToken() && !telegramChatId;
  return (
    <>
      {/* Guests have no email and nothing to sign in with again, so no logout either. */}
      <AppHeader email={isGuestEmail(user.email) ? null : user.email} />
      {askTelegram && (
        <div className="border-b bg-mist/60">
          <div className="container py-4">
            <p className="mb-2 font-serif text-lg font-semibold">Подключите Telegram, чтобы получить результаты</p>
            <TelegramConnect connected={false} />
          </div>
        </div>
      )}
      {children}
    </>
  );
}
