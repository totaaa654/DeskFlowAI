import { describe, expect, it } from "vitest";
import { filterTickets, recentTickets } from "@/data/tickets";

describe("filterTickets", () => {
  it("returns all tickets for an empty query", () => {
    expect(filterTickets(recentTickets, "   ")).toBe(recentTickets);
  });

  it("matches ticket metadata without case sensitivity", () => {
    expect(filterTickets(recentTickets, "maya").map((ticket) => ticket.id)).toEqual(["DF-1048"]);
    expect(filterTickets(recentTickets, "RESOLVED").map((ticket) => ticket.id)).toEqual([
      "DF-1044",
    ]);
  });

  it("returns an empty result when nothing matches", () => {
    expect(filterTickets(recentTickets, "not-a-ticket")).toEqual([]);
  });
});

