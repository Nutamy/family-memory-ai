import { NextResponse } from "next/server";
import { getSessionUserId, HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { botToken, botUsername, ensureWebhook } from "@/lib/integrations/telegram";
import { rateLimit } from "@/lib/security/rate-limit";

async function currentUserId() {
  const id = await getSessionUserId();
  if (!id) throw new HttpError(401, "Требуется вход");
  return id;
}

/** Polled by the page while the person presses Start in the bot. */
export const GET = route(async () => {
  const user = await db.user.findUnique({ where: { id: await currentUserId() }, select: { telegramChatId: true } });
  return NextResponse.json({ connected: !!user?.telegramChatId });
});

/** Returns the t.me deep link with a fresh one-time code; the webhook links the chat. */
export const POST = route(async (req) => {
  const userId = await currentUserId();
  const token = botToken();
  if (!token) throw new HttpError(501, "Бот не настроен: задайте TELEGRAM_BOT_TOKEN");
  await rateLimit(`tg-link:${userId}`, { limit: 20, windowSec: 60 * 60 });

  // Telegram only delivers webhooks to public HTTPS URLs (not to localhost in development).
  const origin = new URL(req.url).origin;
  if (origin.startsWith("https://")) await ensureWebhook(token, origin);

  const code = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, "0")).join("");
  await db.user.update({ where: { id: userId }, data: { telegramLinkCode: code } });
  return NextResponse.json({ url: `https://t.me/${await botUsername(token)}?start=${code}` });
});
