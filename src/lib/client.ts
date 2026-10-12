// Browser-side fetch helper for the JSON API.
export async function api<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(path, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    const msg = (await res.json().catch(() => null))?.error ?? `Ошибка ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}
