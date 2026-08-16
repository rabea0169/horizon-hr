import { describe, it, expect } from "vitest";
import { createToken, verifyToken, authenticateHorizonRequest } from "./horizon-auth";

describe("Horizon JWT Authentication", () => {
  const mockUser = {
    id: 123,
    username: "test_user",
    role: "admin",
    fullName: "Test Admin User",
  };

  it("should generate a valid JWT token", async () => {
    const token = await createToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // Standard JWT format
  });

  it("should successfully verify a valid JWT token and recover payload", async () => {
    const token = await createToken(mockUser);
    const decoded = await verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(mockUser.id);
    expect(decoded?.username).toBe(mockUser.username);
    expect(decoded?.role).toBe(mockUser.role);
  });

  it("should return null for an invalid JWT token", async () => {
    const decoded = await verifyToken("invalid.token.here");
    expect(decoded).toBeNull();
  });

  it("should authenticate a request via Authorization Header", async () => {
    const token = await createToken(mockUser);
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    
    const user = await authenticateHorizonRequest(headers);
    expect(user).toBeDefined();
    expect(user?.username).toBe(mockUser.username);
  });

  it("should authenticate a request via Cookies", async () => {
    const token = await createToken(mockUser);
    const headers = new Headers();
    headers.set("Cookie", `other_cookie=xyz; hr_auth_token=${encodeURIComponent(token)}; another=123`);
    
    const user = await authenticateHorizonRequest(headers);
    expect(user).toBeDefined();
    expect(user?.username).toBe(mockUser.username);
  });

  it("should return undefined if no credentials are provided", async () => {
    const headers = new Headers();
    const user = await authenticateHorizonRequest(headers);
    expect(user).toBeUndefined();
  });
});
