/**
 * Texte comparable : minuscule, sans accents, sans "&", tout autre signe remplace par un espace.
 * @param {string} s
 * @returns {string}
 */

export function normText(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
