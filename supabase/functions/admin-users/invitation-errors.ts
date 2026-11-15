export type InvitationFailureCode =
  | "INVITATION_CONFLICT"
  | "SMTP_RECIPIENT_REJECTED"
  | "SMTP_RATE_LIMITED"
  | "SMTP_DELIVERY_FAILED"
  | "AUTH_INVITATION_FAILED";

export interface AuthProviderError {
  code?: string;
  message?: string;
  status?: number;
}

export interface InvitationFailure {
  code: InvitationFailureCode;
  message: string;
  status: number;
}

export function classifyInvitationFailure(error: AuthProviderError | null): InvitationFailure {
  const providerCode = error?.code?.toLowerCase() ?? "";
  const providerMessage = error?.message?.toLowerCase() ?? "";

  if (
    ["email_exists", "user_already_exists", "email_conflict_identity_not_deletable"].includes(providerCode)
    || providerMessage.includes("already registered")
    || providerMessage.includes("already exists")
  ) {
    return {
      code: "INVITATION_CONFLICT",
      status: 409,
      message: "Invitation conflict: an Auth account already exists for this email address.",
    };
  }

  if (providerCode === "email_address_not_authorized" || providerMessage.includes("email address not authorized")) {
    return {
      code: "SMTP_RECIPIENT_REJECTED",
      status: 502,
      message: "SMTP delivery failed: the configured Supabase Auth mail provider rejected this recipient.",
    };
  }

  if (
    providerCode === "over_email_send_rate_limit"
    || providerMessage.includes("email rate limit")
    || error?.status === 429
  ) {
    return {
      code: "SMTP_RATE_LIMITED",
      status: 429,
      message: "SMTP delivery is rate-limited. Wait for the provider limit to reset, then retry.",
    };
  }

  if (
    providerMessage.includes("smtp")
    || providerMessage.includes("sending invite email")
    || providerMessage.includes("send invitation email")
    || providerMessage.includes("gomail")
  ) {
    return {
      code: "SMTP_DELIVERY_FAILED",
      status: 502,
      message: "SMTP delivery failed. Verify the Supabase Auth SMTP host, port, Gmail address, and Google App Password, then check the Auth logs.",
    };
  }

  return {
    code: "AUTH_INVITATION_FAILED",
    status: 502,
    message: "Supabase Auth could not create and deliver the invitation. Check the Supabase Auth logs and retry.",
  };
}
