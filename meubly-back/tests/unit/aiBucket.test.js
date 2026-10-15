import { describe, it, expect, vi, beforeEach } from "vitest";

const storage = vi.hoisted(() => ({ listBuckets: vi.fn(), createBucket: vi.fn() }));
vi.mock("../../supabase.js", () => ({ supabase: { storage } }));
vi.mock("replicate", () => ({ default: vi.fn() }));

describe("aiController bucket", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../controllers/aiController.js");
    mod.__resetBucketStateForTests();
  });

  it("n'appelle pas Storage a l'import", async () => {
    await import("../../controllers/aiController.js");
    expect(storage.listBuckets).not.toHaveBeenCalled();
  });

  it("cree le bucket une seule fois sur appels concurrents", async () => {
    storage.listBuckets.mockResolvedValue({ data: [] });
    storage.createBucket.mockResolvedValue({ error: null });
    const { ensureBucketOnce } = await import("../../controllers/aiController.js");
    await Promise.all([ensureBucketOnce(), ensureBucketOnce()]);
    expect(storage.createBucket).toHaveBeenCalledTimes(1);
  });

  it("ne memorise pas un echec", async () => {
    storage.listBuckets.mockRejectedValueOnce(new Error("down"));
    const { ensureBucketOnce } = await import("../../controllers/aiController.js");
    await expect(ensureBucketOnce()).rejects.toThrow("down");
    storage.listBuckets.mockResolvedValue({ data: [{ name: "ai-generated" }] });
    await expect(ensureBucketOnce()).resolves.toBeUndefined();
    expect(storage.listBuckets).toHaveBeenCalledTimes(2);
  });
});
