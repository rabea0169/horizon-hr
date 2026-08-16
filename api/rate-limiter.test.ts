import { describe, it, expect, vi } from "vitest";
import { loginRateLimit } from "./lib/rate-limiter";

describe("loginRateLimit", () => {
  it("should allow first request", () => {
    const res = loginRateLimit("127.0.0.1");
    expect(res.allowed).toBe(true);
    expect(res.retryAfter).toBe(0);
  });

  it("should block requests exceeding the maximum limit", () => {
    const ip = "192.168.1.1";
    // First 10 requests should be allowed
    for (let i = 0; i < 10; i++) {
      const res = loginRateLimit(ip);
      expect(res.allowed).toBe(true);
    }
    // 11th request should be blocked
    const blockedRes = loginRateLimit(ip);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.retryAfter).toBeGreaterThan(0);
  });
});
