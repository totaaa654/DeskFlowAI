import { describe, expect, it } from "vitest";
import { canAdminInviteRole, canAdminManageRole, isAdministrator } from "./role-permissions";

describe("four-tier role permissions", () => {
  it("allows a Super Admin to invite every role", () => {
    expect(["employee", "technician", "it_admin", "super_admin"].every((role) =>
      canAdminInviteRole("super_admin", role as Parameters<typeof canAdminInviteRole>[1])))
      .toBe(true);
  });

  it("limits IT Admin invitations to employees and technicians", () => {
    expect(canAdminInviteRole("it_admin", "employee")).toBe(true);
    expect(canAdminInviteRole("it_admin", "technician")).toBe(true);
    expect(canAdminInviteRole("it_admin", "it_admin")).toBe(false);
    expect(canAdminInviteRole("it_admin", "super_admin")).toBe(false);
  });

  it("never grants administration to employees or technicians", () => {
    expect(isAdministrator("employee")).toBe(false);
    expect(isAdministrator("technician")).toBe(false);
    expect(canAdminManageRole("employee", "employee")).toBe(false);
  });
});
