import { describe, it, expect, vi } from "vitest";
import { decide } from "../../../ingestion/match.js";

const EAN = "5710441309116";
const item = (gtin) => ({ gtin, brand: "HAY", productTitle: "Pouf Planar" });

function lookup({ known = null, similar = [] } = {}) {
  return {
    furnitureByGtin: vi.fn(async () => known),
    similar: vi.fn(async () => similar),
  };
}

describe("decide", () => {
  it("rattache a un meuble deja connu par son EAN", async () => {
    const l = lookup({ known: { furniture_id: "f1", product_id: "p1" } });
    expect(await decide(item(EAN), l)).toEqual({ action: "attach", furnitureId: "f1" });
    expect(l.similar).not.toHaveBeenCalled();
  });

  it("cree un meuble pour un EAN valide inconnu", async () => {
    const l = lookup();
    expect(await decide(item(EAN), l)).toEqual({ action: "create" });
    expect(l.similar).not.toHaveBeenCalled();
  });

  it("propose un rapprochement sans EAN quand un meuble proche existe", async () => {
    const candidates = [{ furniture_id: "f2", score: 0.8 }];
    const l = lookup({ similar: candidates });
    expect(await decide(item(null), l)).toEqual({ action: "candidate", candidates });
    expect(l.similar).toHaveBeenCalledWith("HAY", "Pouf Planar");
  });

  it("ignore un article sans EAN ni meuble proche", async () => {
    expect(await decide(item(null), lookup())).toEqual({ action: "skip" });
  });

  it("traite un EAN a cle fausse comme une absence d'EAN", async () => {
    const l = lookup();
    expect(await decide(item("5710441309117"), l)).toEqual({ action: "skip" });
    expect(l.furnitureByGtin).not.toHaveBeenCalled();
  });
});
