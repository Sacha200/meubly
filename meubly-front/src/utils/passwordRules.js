/**
 * Regles de mot de passe, alignees sur la configuration Supabase Auth
 * (longueur minimale 10, minuscules, majuscules et chiffres).
 * Supabase revalide cote serveur : ces regles servent a guider l'utilisateur.
 */
export const PASSWORD_MIN_LENGTH = 10;

const RULES = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH} caractères minimum`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "upper", label: "Une majuscule", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Une minuscule", test: (v) => /[a-z]/.test(v) },
  { id: "digit", label: "Un chiffre", test: (v) => /[0-9]/.test(v) },
];

/**
 * Etat de chaque regle pour un mot de passe donne.
 * @param {string} value
 * @returns {{ id: string, label: string, ok: boolean }[]}
 */
export function passwordChecks(value) {
  const v = value || "";
  return RULES.map(({ id, label, test }) => ({ id, label, ok: test(v) }));
}

/**
 * @param {string} value
 * @returns {boolean} true si toutes les regles sont respectees
 */
export function isPasswordValid(value) {
  return passwordChecks(value).every((check) => check.ok);
}
