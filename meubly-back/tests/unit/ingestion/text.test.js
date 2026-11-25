import { it, expect } from "vitest";
import { normText } from "../../../ingestion/text.js";

it("normalise une marque : minuscules, sans accents, sans &, espaces reduits", () => {
  expect(normText("&Tradition  Été")).toBe("tradition ete");
});
