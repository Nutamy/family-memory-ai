// Password hashing on WebCrypto PBKDF2: native code in workerd, Node and browsers, so a hash
// costs a fraction of bcryptjs' pure-JS CPU time (Workers Free gives 10 ms per request).
// Format: pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>. Iterations live in the hash,
// so raising them later keeps old hashes valid. No server-only marker: prisma/seed.ts uses it too.

// workerd rejects PBKDF2 above 100 000 iterations. ~20 ms of CPU, paid only on sign-in and
// registration; PASSWORD_ITERATIONS can lower it if Workers Free reports "Exceeded CPU Limit".
const MAX_ITERATIONS = 100_000;
const iterations = () => Math.min(MAX_ITERATIONS, Math.max(10_000, Number(process.env.PASSWORD_ITERATIONS) || MAX_ITERATIONS));
const KEY_BITS = 256;

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, KEY_BITS));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const n = iterations();
  return `pbkdf2-sha256$${n}$${b64(salt)}$${b64(await derive(password, salt, n))}`;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, salt, hash] = stored.split("$");
  if (scheme === "pbkdf2-sha256" && iter && salt && hash) {
    const n = Number(iter);
    if (!Number.isInteger(n) || n < 1 || n > MAX_ITERATIONS) return false;
    return timingSafeEqual(await derive(password, unb64(salt), n), unb64(hash));
  }
  // Accounts created before the switch from bcrypt.
  if (stored.startsWith("$2")) {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(password, stored);
  }
  return false;
}

// Compared against when the email is unknown, so response time does not reveal registered emails.
let dummy: Promise<string> | null = null;
export const dummyPasswordHash = () => (dummy ??= hashPassword("timing-equalizer"));
