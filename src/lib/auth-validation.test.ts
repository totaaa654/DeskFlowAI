import { describe, expect, it } from "vitest";
import { validateEmail, validateNewPassword } from "./auth-validation";

describe("authentication validation", () => {
  it("rejects malformed email addresses", () => {
    expect(validateEmail("not-an-email")).toBe("Enter a valid company email address.");
    expect(validateEmail("alex@company.test")).toBeNull();
  });

  it("requires a strong new password", () => {
    expect(validateNewPassword("short")).toBe("Password must be at least 8 characters.");
    expect(validateNewPassword("alllowercase1")).toBe("Use uppercase, lowercase, and at least one number.");
    expect(validateNewPassword("CloudDesk1")).toBeNull();
  });
});
