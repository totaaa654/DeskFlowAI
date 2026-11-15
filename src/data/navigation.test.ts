import { describe, expect, it } from "vitest";
import { getNavigationForRole } from "./navigation";

describe("role-specific navigation", () => {
  it("does not expose admin pages to employees", () => {
    expect(getNavigationForRole("employee").map((item) => item.id)).toEqual(["dashboard", "my-tickets", "create-ticket", "notifications", "settings"]);
  });

  it("exposes user management only to administrators", () => {
    expect(getNavigationForRole("technician").some((item) => item.id === "users")).toBe(false);
    expect(getNavigationForRole("it_admin").some((item) => item.id === "users")).toBe(true);
    expect(getNavigationForRole("super_admin").some((item) => item.id === "administrators")).toBe(true);
    expect(getNavigationForRole("it_admin").some((item) => item.id === "administrators")).toBe(false);
  });
});
