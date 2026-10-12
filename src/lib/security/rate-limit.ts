import "server-only";
import { HttpError } from "../auth";
import { db } from "../db";

async function sha256(s: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Client IP: Cloudflare sets cf-connecting-ip; x-forwarded-for is only trustworthy behind your own proxy. */
export function clientIp(req: Request) {
  const h = req.headers;
  return h.get("cf-connecting-ip") || h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Throws 429 once `key` is hit more than `limit` times within `windowSec`. */
export async function rateLimit(key: string, { limit, windowSec }: { limit: number; windowSec: number }) {
  const id = await sha256(key);
  const now = new Date();
  const row = await db.rateLimit.findUnique({ where: { key: id } });

  if (!row || row.resetAt <= now) {
    const resetAt = new Date(now.getTime() + windowSec * 1000);
    await db.rateLimit.upsert({ where: { key: id }, create: { key: id, count: 1, resetAt }, update: { count: 1, resetAt } });
    // Occasional cleanup instead of a cron job.
    if (Math.random() < 0.02) await db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }).catch(() => {});
    return;
  }
  if (row.count >= limit) {
    const minutes = Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 60_000));
    throw new HttpError(429, `Слишком много попыток. Повторите через ${minutes} мин.`);
  }
  await db.rateLimit.update({ where: { key: id }, data: { count: { increment: 1 } } });
}
