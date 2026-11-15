/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { classifyInvitationFailure } from "../../supabase/functions/admin-users/invitation-errors";

describe("invitation delivery boundary", () => {
  it("uses the Supabase Auth Admin invitation API without a direct Resend integration", () => {
    const source = readFileSync(
      resolve(process.cwd(), "supabase/functions/admin-users/index.ts"),
      "utf8",
    );

    expect(source).toContain("adminClient.auth.admin.inviteUserByEmail");
    expect(source).not.toMatch(/api\.resend\.com|RESEND_API_KEY|new\s+Resend|resend\.emails/i);
  });

  it("reports an existing Auth account as an invitation conflict", () => {
    expect(classifyInvitationFailure({ code: "user_already_exists", status: 422 })).toMatchObject({
      code: "INVITATION_CONFLICT",
      status: 409,
    });
  });

  it("reports SMTP and provider rate-limit failures separately", () => {
    expect(classifyInvitationFailure({ message: "Error sending invite email" })).toMatchObject({
      code: "SMTP_DELIVERY_FAILED",
      status: 502,
    });
    expect(classifyInvitationFailure({ code: "over_email_send_rate_limit", status: 429 })).toMatchObject({
      code: "SMTP_RATE_LIMITED",
      status: 429,
    });
  });
});
