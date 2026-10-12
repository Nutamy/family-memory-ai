// Telegram Bot API client for delivering archive results to a chat.
// Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (common alternative names are accepted
// so variables already created in the hosting dashboard keep working).

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

export function telegramConfig() {
  const token = env("TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN", "BOT_TOKEN", "TG_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID", "TG_CHAT_ID", "CHAT_ID");
  return token && chatId ? { token, chatId } : null;
}

type TelegramResponse = { ok?: boolean; description?: string; parameters?: { retry_after?: number } };

async function call(token: string, method: string, body: FormData | Record<string, unknown>) {
  const isForm = body instanceof FormData;
  // Multi-part deliveries hit the per-chat flood limit; Telegram answers 429 with retry_after.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: isForm ? undefined : { "Content-Type": "application/json" },
      body: isForm ? body : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as TelegramResponse | null;
    const wait = json?.parameters?.retry_after;
    if (res.status === 429 && wait && attempt < 3) {
      await new Promise((r) => setTimeout(r, Math.min(wait, 60) * 1000));
      continue;
    }
    if (!res.ok || !json?.ok) throw new Error(`Telegram: ${json?.description ?? res.status}`);
    return json;
  }
}

export class TelegramClient {
  constructor(
    private token: string,
    private chatId: string,
  ) {}

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
      await call(this.token, "sendMessage", { chat_id: this.chatId, text, parse_mode: "HTML", disable_web_page_preview: true });
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
    await call(this.token, "sendDocument", form);
  }
}

export function getTelegramClient(): TelegramClient | null {
  const cfg = telegramConfig();
  return cfg ? new TelegramClient(cfg.token, cfg.chatId) : null;
}

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
