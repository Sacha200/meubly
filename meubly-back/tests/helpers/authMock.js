// Jetons factices reconnus par le mock de supabase.auth.getUser (tests unitaires uniquement).
export const TOKENS = { admin: "admin-token", user: "user-token", banned: "banned-token" };

export const USERS = {
  admin: { id: "00000000-0000-4000-8000-00000000000a" },
  user: { id: "00000000-0000-4000-8000-00000000000b" },
  banned: { id: "00000000-0000-4000-8000-00000000000c" },
};

/** @param {keyof typeof TOKENS} kind */
export const bearer = (kind) => `Bearer ${TOKENS[kind]}`;

/**
 * Programme les mocks : `supabaseMock.auth.getUser(token)` et `userRepositoryMock.findRoleByUserId(id)`.
 * @param {{ auth: { getUser: import("vitest").Mock } }} supabaseMock
 * @param {{ findRoleByUserId: import("vitest").Mock }} userRepositoryMock
 */
export function mockAuth(supabaseMock, userRepositoryMock) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
  supabaseMock.auth.getUser.mockImplementation(async (token) => {
    if (token === TOKENS.admin) return { data: { user: { ...USERS.admin } }, error: null };
    if (token === TOKENS.user) return { data: { user: { ...USERS.user } }, error: null };
    if (token === TOKENS.banned) {
      return { data: { user: { ...USERS.banned, banned_until: tomorrow } }, error: null };
    }
    return { data: { user: null }, error: { message: "invalid JWT", status: 401 } };
  });
  userRepositoryMock.findRoleByUserId.mockImplementation(async (id) =>
    id === USERS.admin.id ? "ADMIN" : "USER"
  );
}
