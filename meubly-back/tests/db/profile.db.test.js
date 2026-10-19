import { describe, it, expect, afterAll } from "vitest";
import { adminClient, createTestUser, deleteTestUser } from "./helpers.js";

const created = [];
async function newUser(metadata) {
  const user = await createTestUser({ metadata });
  created.push(user.id);
  return user;
}

async function profileOf(id) {
  const { data, error } = await adminClient()
    .from("profile")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

describe("profile lie a Supabase Auth (base locale)", () => {
  afterAll(async () => {
    for (const id of created) await deleteTestUser(id).catch(() => {});
  });

  it("cree un profil USER a l'inscription meme si les metadonnees demandent ADMIN", async () => {
    const user = await newUser({ username: "alice", lastname: "Martin", role: "ADMIN" });
    const profile = await profileOf(user.id);
    expect(profile).toMatchObject({
      role: "USER",
      username: "alice",
      lastname: "Martin",
      email: user.email,
    });
  });

  it("synchronise l'email du profil", async () => {
    const user = await newUser();
    const next = `renamed_${Date.now()}@meubly.test`;
    const { error } = await adminClient().auth.admin.updateUserById(user.id, {
      email: next,
      email_confirm: true,
    });
    expect(error).toBeNull();
    expect((await profileOf(user.id)).email).toBe(next);
  });

  it("supprime le profil avec le compte", async () => {
    const user = await newUser();
    await deleteTestUser(user.id);
    expect(await profileOf(user.id)).toBeNull();
  });

  it("refuse un role hors USER/ADMIN", async () => {
    const user = await newUser();
    const { error } = await adminClient()
      .from("profile")
      .update({ role: "User" })
      .eq("user_id", user.id);
    expect(error?.code).toBe("23514");
  });

  it("n'a plus de colonne password_hash", async () => {
    const { error } = await adminClient().from("profile").select("password_hash").limit(1);
    expect(error?.code).toBe("42703");
  });
});
