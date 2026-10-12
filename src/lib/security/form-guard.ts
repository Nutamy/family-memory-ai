import "server-only";
import { HttpError } from "../auth";
import { clientIp } from "./rate-limit";

export const HONEYPOT_FIELD = "website";
export const TURNSTILE_FIELD = "cf-turnstile-response";

/** Public site key for the widget; Turnstile is enforced only when both keys are set. */
export const turnstileSiteKey = () => (process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_SITE_KEY) || null;

/** Bot checks for public forms: hidden honeypot field + Cloudflare Turnstile token. */
export async function guardPublicForm(req: Request, body: Record<string, unknown>) {
  // Humans never see the honeypot; reply with a neutral error so bots learn nothing.
  if (String(body[HONEYPOT_FIELD] ?? "").trim()) throw new HttpError(400, "Проверьте данные формы");

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !process.env.TURNSTILE_SITE_KEY) return;
  const token = String(body[TURNSTILE_FIELD] ?? "");
  if (!token || token.length > 2048) throw new HttpError(400, "Подтвердите, что вы не робот");

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  form.append("remoteip", clientIp(req));
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
  if (!json?.success) throw new HttpError(403, "Проверка «не робот» не пройдена, обновите страницу");
}
