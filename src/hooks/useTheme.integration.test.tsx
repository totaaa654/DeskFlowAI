// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, useTheme } from "@/hooks/useTheme";

function ThemeHarness() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

let root: Root | undefined;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  document.body.innerHTML = '<div id="test-root"></div>';
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
    root = undefined;
  }
});

describe("useTheme", () => {
  it("toggles the DOM theme and restores it from local storage", async () => {
    const container = document.getElementById("test-root");
    expect(container).not.toBeNull();

    root = createRoot(container!);
    await act(async () => root?.render(<ThemeHarness />));

    const button = container!.querySelector("button");
    expect(button?.textContent).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await act(async () => button?.click());
    expect(button?.textContent).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await act(async () => root?.unmount());
    root = undefined;
    document.body.innerHTML = '<div id="restart-root"></div>';

    const restartContainer = document.getElementById("restart-root");
    root = createRoot(restartContainer!);
    await act(async () => root?.render(<ThemeHarness />));

    expect(restartContainer?.querySelector("button")?.textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

