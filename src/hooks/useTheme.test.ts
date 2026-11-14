import { describe, expect, it } from "vitest";
import { readStoredTheme, THEME_STORAGE_KEY } from "@/hooks/useTheme";

function storageWith(value: string | null): Pick<Storage, "getItem"> {
  return {
    getItem: (key: string) => (key === THEME_STORAGE_KEY ? value : null),
  };
}

describe("readStoredTheme", () => {
  it("restores dark mode", () => {
    expect(readStoredTheme(storageWith("dark"))).toBe("dark");
  });

  it("uses light mode for missing or invalid values", () => {
    expect(readStoredTheme(storageWith(null))).toBe("light");
    expect(readStoredTheme(storageWith("unknown"))).toBe("light");
  });
});

