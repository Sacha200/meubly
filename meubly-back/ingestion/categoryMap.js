// Range un article dans l'une des 11 categories racines du catalogue maison (migration de la tache 1).
import { normText } from "./text.js";

/**
 * La premiere regle qui correspond l'emporte : l'ordre compte (le jardin prime sur la table).
 * Connox annonce ses types en allemand (Leuchten, Geschirr, Kinder) : ils sont dans la table.
 */
const RULES = [
  ["Jardin et exterieur", /jardin|exterieur|outdoor|terrasse|parasol|transat/],
  ["Luminaires", /lampe|suspension|lampadaire|applique|baladeuse|luminaire|plafonnier|leuchten/],
  ["Enfant", /enfant|bebe|baby|kids|kinder/],
  ["Salle de bain", /salle de bain|douche|porte savon|serviette de bain/],
  [
    "Cuisine et salle a manger",
    /cuisine|kuche|kochen|geschirr|arts de la table|salle a manger|sets? de table|vaisselle|assiette|tasse|mug|carafe|pichet|sucrier|\bbol\b|plateau|dessous de verre|couverts|casserole|theiere|cafetiere/,
  ],
  ["Bureau", /bureau/],
  ["Chambre", /\blit\b(?! de jour)|matelas|chevet|linge de lit|housse de couette|oreiller/],
  [
    "Rangement",
    /etagere|bibliotheque|commode|buffet|rangement|armoire|console|portemanteau|patere/,
  ],
  ["Decoration", /vase|miroir|tapis|coussin|bougeoir|bougie|plaid|cadre|affiche|horloge/],
  [
    "Salon",
    /chaise|tabouret|fauteuil|lounge|pouf|canape|sofa|daybed|banquette|lit de jour|\bbanc\b|\btable\b/,
  ],
];

const labelOf = (text) => RULES.find(([, pattern]) => pattern.test(normText(text ?? "")))?.[0];

/**
 * Categorie racine d'un article : d'apres le type annonce par le marchand, sinon le titre.
 * @param {{ categoryHint: string|null, productTitle: string }} item
 * @returns {string}
 */
export function categoryLabelFor(item) {
  return labelOf(item.categoryHint) ?? labelOf(item.productTitle) ?? "Autres";
}
