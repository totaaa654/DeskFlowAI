import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

export type CallbackKind = "invite" | "recovery" | "authentication";

export function isTrustedAuthCallback(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "deskflowai:" && url.hostname === "auth" && url.pathname === "/callback";
  } catch {
    return false;
  }
}

export async function consumeAuthCallback(
  client: SupabaseClient,
  rawUrl: string,
): Promise<CallbackKind> {
  if (!isTrustedAuthCallback(rawUrl)) throw new Error("The authentication link is not valid.");

  const url = new URL(rawUrl);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const query = url.searchParams;
  const type = query.get("type") ?? hash.get("type");
  const callbackError = query.get("error_description") ?? hash.get("error_description")
    ?? query.get("error") ?? hash.get("error");
  if (callbackError) throw new Error(callbackError.replace(/\+/g, " "));

  const code = query.get("code");
  const tokenHash = query.get("token_hash") ?? hash.get("token_hash");
  const accessToken = hash.get("access_token") ?? query.get("access_token");
  const refreshToken = hash.get("refresh_token") ?? query.get("refresh_token");

  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
  } else if (tokenHash && type && ["invite", "recovery", "email", "magiclink"].includes(type)) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (error) throw error;
  } else if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
  } else {
    throw new Error("The authentication link is incomplete or has expired.");
  }

  if (type === "recovery") return "recovery";
  if (type === "invite") return "invite";
  return "authentication";
}
