import { it, expect } from "vitest";
import { canonicalBrand, commonBrands } from "../../../ingestion/brands.js";

it("ramene une marque a son nom canonique", () => {
  expect(canonicalBrand("Audo Copenhagen")).toBe("audo");
  expect(canonicalBrand("&Tradition")).toBe("tradition");
});

it("garde les marques vendues par au moins deux marchands", () => {
  const common = commonBrands([
    new Set(["hay", "muuto"]),
    new Set(["hay"]),
    new Set(["muuto", "gubi"]),
  ]);
  expect(common).toEqual(new Set(["hay", "muuto"]));
});

it("compte une marque une seule fois par marchand, alias compris", () => {
  expect(commonBrands([new Set(["audo", "audo copenhagen"]), new Set(["hay"])])).toEqual(new Set());
});
