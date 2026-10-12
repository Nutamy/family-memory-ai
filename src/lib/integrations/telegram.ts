// Telegram Bot API client. TELEGRAM_BOT_TOKEN is the bot; TELEGRAM_CHAT_ID (optional) is the
// owner's chat that receives a copy of every delivery. People link their own chats through the
// bot (see src/app/api/telegram/webhook). Common alternative variable names are accepted so
// values already created in the hosting dashboard keep working.

// Overridable for local Bot API servers or proxies.
const API = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";
// Bot API limit for documents uploaded by bots.
export const TELEGRAM_MAX_FILE_BYTES = 50 * 1024 * 1024;

function env(...names: string[]) {
  for (const n of names) {
    const v = process.env[n]?.trim();
    if (v) return v;
  }
  return undefined;
}

export const botToken = () => env("TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN", "BOT_TOKEN", "TG_BOT_TOKEN");
/** Owner's chat for copies of all results. */
export const ownerChatId = () => env("TELEGRAM_CHAT_ID", "TG_CHAT_ID", "CHAT_ID");

type TelegramResponse<T = unknown> = { ok?: boolean; description?: string; result?: T; parameters?: { retry_after?: number } };

async function call<T = unknown>(token: string, method: string, body: FormData | Record<string, unknown>): Promise<T> {
  const isForm = body instanceof FormData;
  // Multi-part deliveries hit the per-chat flood limit; Telegram answers 429 with retry_after.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: isForm ? undefined : { "Content-Type": "application/json" },
      body: isForm ? body : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as TelegramResponse<T> | null;
    const wait = json?.parameters?.retry_after;
    if (res.status === 429 && wait && attempt < 3) {
      await new Promise((r) => setTimeout(r, Math.min(wait, 60) * 1000));
      continue;
    }
    if (!res.ok || !json?.ok) throw new Error(`Telegram: ${json?.description ?? res.status}`);
    return json.result as T;
  }
}

export class TelegramClient {
  /** `copyTo`: every message is also copied there (no re-upload of files). */
  constructor(
    private token: string,
    private chatId: string,
    private copyTo?: string,
  ) {}

  private async mirror(messageId: number) {
    if (!this.copyTo || this.copyTo === this.chatId) return;
    await call(this.token, "copyMessage", { chat_id: this.copyTo, from_chat_id: this.chatId, message_id: messageId });
  }

  /** HTML parse mode; messages over 4096 chars are split on line breaks. */
  async sendMessage(html: string) {
    const chunks: string[] = [];
    let current = "";
    for (const line of html.split("\n")) {
      if ((current + line).length > 3900 && current) {
        chunks.push(current);
        current = "";
      }
      current += line + "\n";
    }
    if (current.trim()) chunks.push(current);
    for (const text of chunks) {
      const msg = await call<{ message_id: number }>(this.token, "sendMessage", {
        chat_id: this.chatId,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
      await this.mirror(msg.message_id);
    }
  }

  async sendDocument(data: Uint8Array, filename: string, caption?: string) {
    if (data.byteLength > TELEGRAM_MAX_FILE_BYTES) {
      // Callers split large payloads first (see src/lib/telegram-delivery.ts).
      throw new Error(`Файл ${filename} больше 50 МБ — Telegram не примет его от бота`);
    }
    const form = new FormData();
    form.append("chat_id", this.chatId);
    form.append("document", new Blob([new Uint8Array(data)]), filename);
    if (caption) {
      form.append("caption", caption.slice(0, 1024));
      form.append("parse_mode", "HTML");
    }
    const msg = await call<{ message_id: number }>(this.token, "sendDocument", form);
    await this.mirror(msg.message_id);
  }
}

/** Plain reply used by the webhook (no copy to the owner). */
export function sendText(token: string, chatId: string | number, html: string) {
  return call(token, "sendMessage", { chat_id: chatId, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } });
}

// Per-isolate caches: bot username and the webhook URL already registered.
let username: { token: string; name: string } | null = null;
let webhookSetFor: string | null = null;

export async function botUsername(token: string) {
  if (username?.token !== token) username = { token, name: (await call<{ username: string }>(token, "getMe", {})).username };
  return username.name;
}

/** Secret Telegram echoes in X-Telegram-Bot-Api-Secret-Token, derived from the bot token. */
export async function webhookSecret(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`webhook:${token}`));
  return Array.from(new Uint8Array(digest).slice(0, 24), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Points the bot at this site; idempotent, so no manual setWebhook step is needed. */
export async function ensureWebhook(token: string, origin: string) {
  const url = `${origin}/api/telegram/webhook`;
  if (webhookSetFor === url) return;
  const info = await call<{ url: string }>(token, "getWebhookInfo", {});
  if (info.url !== url) {
    await call(token, "setWebhook", { url, secret_token: await webhookSecret(token), allowed_updates: ["message"], drop_pending_updates: true });
  }
  webhookSetFor = url;
}

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
