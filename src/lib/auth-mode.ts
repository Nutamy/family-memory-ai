// Edge-safe: used by middleware, pages and route handlers.
// - guest (default): no sign-in; a visitor gets an anonymous account on "Начать",
//   and the bot later sends a "continue" link (src/lib/guest.ts);
// - access: Cloudflare Access in front of the site (src/lib/access.ts);
// - password: email + password, AUTH_MODE=password.
import { isAccessMode } from "./access";

export type AuthMode = "guest" | "access" | "password";

export function authMode(): AuthMode {
  if (isAccessMode()) return "access";
  return process.env.AUTH_MODE === "password" ? "password" : "guest";
}

/** Guest accounts get a placeholder email: User.email is required and unique. */
export const GUEST_EMAIL_DOMAIN = "guest.invalid";
export const isGuestEmail = (email: string) => email.endsWith(`@${GUEST_EMAIL_DOMAIN}`);
