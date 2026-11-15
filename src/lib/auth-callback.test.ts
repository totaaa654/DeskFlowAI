import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { consumeAuthCallback, isTrustedAuthCallback } from "./auth-callback";

describe("desktop auth callback validation", () => {
  it("accepts only the DeskFlow authentication callback", () => {
    expect(isTrustedAuthCallback("deskflowai://auth/callback?code=abc")).toBe(true);
    expect(isTrustedAuthCallback("deskflowai://other/callback?code=abc")).toBe(false);
    expect(isTrustedAuthCallback("https://evil.example/auth/callback?code=abc")).toBe(false);
  });

  it("creates an invite session from callback tokens", async () => {
    const setSession = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { setSession } } as unknown as SupabaseClient;

    await expect(consumeAuthCallback(
      client,
      "deskflowai://auth/callback#access_token=access&refresh_token=refresh&type=invite",
    )).resolves.toBe("invite");
    expect(setSession).toHaveBeenCalledWith({ access_token: "access", refresh_token: "refresh" });
  });

  it("supports secure token-hash invite callbacks", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { verifyOtp } } as unknown as SupabaseClient;

    await expect(consumeAuthCallback(
      client,
      "deskflowai://auth/callback?token_hash=hashed&type=invite",
    )).resolves.toBe("invite");
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "hashed", type: "invite" });
  });
});
