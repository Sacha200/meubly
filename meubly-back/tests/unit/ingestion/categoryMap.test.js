import { it, expect } from "vitest";
import { categoryLabelFor } from "../../../ingestion/categoryMap.js";

const label = (productTitle, categoryHint = null) =>
  categoryLabelFor({ productTitle, categoryHint });

it.each([
  ["Suspension PH 5", "Luminaires"],
  ["Chaise About A Chair", "Salon"],
  ["Table de jardin Palissade", "Jardin et exterieur"],
  ["Lit de jour Mira", "Salon"],
  ["Objet inconnu", "Autres"],
])("%s -> %s", (title, expected) => {
  expect(label(title)).toBe(expected);
});

it("regarde le type annonce par le marchand avant le titre", () => {
  expect(label("Apex", "Lampe de table")).toBe("Luminaires");
});
