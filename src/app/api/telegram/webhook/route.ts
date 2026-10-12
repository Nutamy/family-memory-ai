import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumeUrl } from "@/lib/guest";
import { botToken, escapeHtml, sendText, webhookSecret } from "@/lib/integrations/telegram";

interface Update {
  message?: { chat: { id: number; type: string }; text?: string };
}

/** Telegram → site. Links a chat on "/start <code>" and answers anything else with instructions. */
export async function POST(req: Request) {
  const token = botToken();
  // Only Telegram knows the secret (set together with the webhook URL).
  if (!token || req.headers.get("x-telegram-bot-api-secret-token") !== (await webhookSecret(token))) {
    return new NextResponse(null, { status: 401 });
  }
  const update = (await req.json().catch(() => null)) as Update | null;
  const msg = update?.message;
  // Private chats only: results must not land in a group.
  if (!msg || msg.chat.type !== "private") return NextResponse.json({ ok: true });

  const origin = new URL(req.url).origin;
  const code = msg.text?.match(/^\/start\s+([a-f0-9]{36})$/)?.[1];
  try {
    const user = code ? await db.user.findUnique({ where: { telegramLinkCode: code }, select: { id: true } }) : null;
    if (user) {
      // The code is single-use: a forwarded link cannot attach a second chat later.
      await db.user.update({ where: { id: user.id }, data: { telegramChatId: String(msg.chat.id), telegramLinkCode: null } });
      await sendText(
        token,
        msg.chat.id,
        [
          "✅ <b>Telegram подключён.</b> Сюда придут ваши результаты.",
          "",
          "Вернитесь на сайт и продолжайте заполнять анкету.",
          `Если закроете страницу или захотите продолжить на другом устройстве — откройте эту ссылку:\n${escapeHtml(await resumeUrl(origin, user.id))}`,
          "",
          "<i>Никому не пересылайте эту ссылку: по ней открывается ваш архив.</i>",
        ].join("\n"),
      );
    } else {
      await sendText(
        token,
        msg.chat.id,
        // The chat id also lets the site owner fill TELEGRAM_CHAT_ID once the webhook is active
        // (getUpdates stops working then).
        `Здравствуйте! Чтобы получать результаты, откройте ${escapeHtml(origin)} и нажмите «Подключить Telegram».\n\nВаш Telegram ID: <code>${msg.chat.id}</code>`,
      );
    }
  } catch (e) {
    // Always 200: a non-2xx makes Telegram retry the same update.
    console.error(e instanceof Error ? `${e.name}: ${e.message}` : e);
  }
  return NextResponse.json({ ok: true });
}
