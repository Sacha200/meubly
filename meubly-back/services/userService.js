import { userRepository } from "../repositories/userRepository.js";
import { authAdminRepository } from "../repositories/authAdminRepository.js";
import { httpError } from "../utils/httpError.js";

const BAN_FOREVER = "876000h";

function toItem(profile, account) {
  const bannedUntil = account?.banned_until ? new Date(account.banned_until) : null;
  return {
    id: profile.user_id,
    email: account?.email ?? profile.email,
    username: profile.username ?? null,
    lastname: profile.lastname ?? null,
    role: profile.role,
    createdAt: account?.created_at ?? profile.created_at ?? null,
    lastSignInAt: account?.last_sign_in_at ?? null,
    blocked: Boolean(bannedUntil && bannedUntil > new Date()),
  };
}

function assertNotSelf(targetId, actorId) {
  if (targetId === actorId) throw httpError(400, "Action impossible sur votre propre compte");
}

export const userService = {
  /** @param {{ q?: string, page: number, limit: number }} params */
  async listUsers({ q, page, limit }) {
    const from = (page - 1) * limit;
    const { rows, count } = await userRepository.search({ q, from, to: from + limit - 1 });
    const accounts = await Promise.all(rows.map((row) => authAdminRepository.getUser(row.user_id)));
    return {
      items: rows.map((row, i) => toItem(row, accounts[i])),
      total: count,
      page,
      limit,
    };
  },

  async getUser(id) {
    const profile = await userRepository.findById(id);
    if (!profile) throw httpError(404, "Utilisateur introuvable");
    return toItem(profile, await authAdminRepository.getUser(id));
  },

  async blockUser(id, actorId) {
    assertNotSelf(id, actorId);
    await authAdminRepository.setBan(id, BAN_FOREVER);
  },

  async unblockUser(id) {
    await authAdminRepository.setBan(id, "none");
  },

  async deleteUser(id, actorId) {
    assertNotSelf(id, actorId);
    await authAdminRepository.deleteUser(id);
  },
};
