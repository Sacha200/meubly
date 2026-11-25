import { describe, it, expect } from "vitest";
import { isGtin, pickGtin } from "../../../ingestion/gtin.js";

describe("gtin", () => {
  it("reconnait un EAN-13 dont la cle est juste", () => {
    expect(isGtin("5710441280323")).toBe(true);
  });

  it.each([
    ["cle fausse", "5710441280324"],
    ["12 chiffres, cle fausse", "510960116082"],
    ["reference fabricant", "AB450-A996"],
    ["vide", null],
  ])("refuse : %s", (_label, value) => {
    expect(isGtin(value)).toBe(false);
  });

  it("prend le premier candidat valide (EAN range dans sku chez Fleux)", () => {
    expect(pickGtin("B9926429-500", "5400959200004")).toBe("5400959200004");
  });

  it("renvoie null sans candidat valide", () => {
    expect(pickGtin("", undefined)).toBeNull();
  });
});
