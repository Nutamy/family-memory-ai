import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError } from "@/lib/auth";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { guardPublicForm } from "@/lib/security/form-guard";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().max(254).email("Некорректный email"),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов").max(200, "Пароль слишком длинный"),
});

export const POST = route(async (req) => {
  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  await rateLimit(`register-ip:${clientIp(req)}`, { limit: 5, windowSec: 60 * 60 });
  await guardPublicForm(req, body);

  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
  const { email, password, name } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { passwordHash: true, provider: true } });
  if (existing) {
    throw new HttpError(
      409,
      !existing.passwordHash && existing.provider === "google"
        ? "Этот email уже зарегистрирован через Google — войдите через Google"
        : "Пользователь с таким email уже существует",
    );
  }
  const user = await db.user.create({ data: { email, name, passwordHash: await hashPassword(password) } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken({ sub: user.id, email }), sessionCookieOptions);
  return res;
});
