import { getFurnitures } from "./furnituresApi";

// Fonction pour récupérer les meubles par catégorie
export async function getFurnituresByCategory(categoryId, opts = {}) {
  const { page = 1, limit = 12, sort = "created_at:desc" } = opts;
  return getFurnitures({ categoryId, page, limit, sort });
}
