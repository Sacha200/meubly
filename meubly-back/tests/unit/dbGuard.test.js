import { describe, it, expect } from "vitest";
import { assertLocalSupabase } from "../db/guard.js";

describe("assertLocalSupabase", () => {
  it.each([
    "http://localhost:54321",
    "http://127.0.0.1:54321",
    "http://host.docker.internal:54321",
  ])("accepte %s", (url) => expect(() => assertLocalSupabase(url)).not.toThrow());

  it.each([
    "http://kong:8000",
    "https://rlxyptqvtpdhrdpdoiwy.supabase.co",
    "https://localhost.evil.com",
    undefined,
    "pas-une-url",
  ])("refuse %s", (url) => expect(() => assertLocalSupabase(url)).toThrow(/local/i));
});
