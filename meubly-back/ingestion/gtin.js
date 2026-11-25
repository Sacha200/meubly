/**
 * Vrai si la valeur est GTIN (EAN-8, UPC-12, EAN-13, GTIN-14) dont la cle de controle est juste.
 * @param {unknown} value
 * @returns {boolean}
 */

export function isGtin(value) {
  if (typeof value !== "string" || !/^(\d{8}|\d{12,14})$/.test(value)) return false;
  const digits = [...value].map(Number);
  const check = digits.pop();
  const sum = digits
    .reverse()
    .reduce((total, digit, i) => total + digit * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * Premier candidat qui est un GTIN valide (les marchands rangent l'EAN dans barcode ou dans sku).
 * @param {...unknown} candidates
 * @returns {string | null}
 */

export function pickGtin(...candidates) {
  return candidates.map((candidate) => String(candidate ?? "").trim()).find(isGtin) ?? null;
}
