interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);
if (cleanup.unref) cleanup.unref();

interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

function checkRateLimit(ip: string, windowMs: number, maxRequests: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_MAX = 10;

export function loginRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(ip, LOGIN_WINDOW, LOGIN_MAX);
}
