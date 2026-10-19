import { partnerRepository } from "../repositories/partnerRepository.js";
import { httpError } from "../utils/httpError.js";

/**
 * Contrat HTTP `/providers` <-> table `partner`.
 * @param {Record<string, any>} row ligne `partner`
 * @returns {{ id: string, name: string, url: string | null, logoUrl: string | null, isActive: boolean, createdAt: string | null }}
 */
export function toProviderDto(row) {
  return {
    id: row.partner_id,
    name: row.name,
    url: row.website_base_url ?? null,
    logoUrl: row.logo_url ?? null,
    isActive: row.is_active ?? false,
    createdAt: row.created_at ?? null,
  };
}

/** Ne garde que les champs connus du DTO, traduits en colonnes `partner`. */
function toPartnerRow({ name, url, logoUrl, isActive }) {
  const row = {};
  if (name !== undefined) row.name = name;
  if (url !== undefined) row.website_base_url = url;
  if (logoUrl !== undefined) row.logo_url = logoUrl;
  if (isActive !== undefined) row.is_active = isActive;
  return row;
}

export const providerService = {
  async getAllProviders() {
    return (await partnerRepository.findAll()).map(toProviderDto);
  },

  async getProviderById(id) {
    const row = await partnerRepository.findById(id);
    if (!row) throw httpError(404, "Partenaire introuvable");
    return toProviderDto(row);
  },

  async createProvider(dto) {
    return toProviderDto(await partnerRepository.create(toPartnerRow(dto)));
  },

  async updateProvider(id, dto) {
    const row = await partnerRepository.update(id, toPartnerRow(dto));
    if (!row) throw httpError(404, "Partenaire introuvable");
    return toProviderDto(row);
  },

  async deleteProvider(id) {
    await partnerRepository.delete(id);
  },
};
