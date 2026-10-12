import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов").max(200),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { email, password, name } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
  }
  const user = await db.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 10) } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken({ sub: user.id, email }), sessionCookieOptions);
  return res;
}
