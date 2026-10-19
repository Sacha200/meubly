import { describe, it, expect, vi, beforeEach } from "vitest";

const storage = vi.hoisted(() => ({ listBuckets: vi.fn(), createBucket: vi.fn() }));
vi.mock("../../supabase.js", () => ({ supabase: { storage } }));
vi.mock("replicate", () => ({ default: vi.fn() }));
vi.mock("../../repositories/furnitureRepository.js", () => ({
  furnitureRepository: {
    findSummary: vi.fn().mockResolvedValue({
      furniture_id: "3f2b6c1e-0000-4000-8000-000000000001",
      cover_url: "https://www.ikea.com/x.jpg",
    }),
  },
}));

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

  it("remonte l'erreur renvoyee (non levee) par listBuckets", async () => {
    storage.listBuckets.mockResolvedValue({ data: null, error: { message: "forbidden" } });
    const { ensureBucketOnce } = await import("../../controllers/aiController.js");
    await expect(ensureBucketOnce()).rejects.toThrow("forbidden");
    expect(storage.createBucket).not.toHaveBeenCalled();
  });

  it("considere un bucket deja existant comme un succes", async () => {
    storage.listBuckets.mockResolvedValue({ data: [], error: null });
    storage.createBucket.mockResolvedValue({
      data: null,
      error: { message: "The resource already exists", status: 409 },
    });
    const { ensureBucketOnce } = await import("../../controllers/aiController.js");
    await expect(ensureBucketOnce()).resolves.toBeUndefined();
  });
});

describe("generateScene", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../../controllers/aiController.js");
    mod.__resetBucketStateForTests();
  });

  it("poursuit la generation si le bucket est indisponible (repli existant)", async () => {
    process.env.REPLICATE_API_TOKEN = "test-token";
    storage.listBuckets.mockResolvedValue({ data: null, error: { message: "forbidden" } });
    const axios = (await import("axios")).default;
    const getSpy = vi.spyOn(axios, "get").mockRejectedValue(new Error("download failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { aiController } = await import("../../controllers/aiController.js");
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    await aiController.generateScene(
      { body: { furnitureId: "3f2b6c1e-0000-4000-8000-000000000001", prompt: "salon" } },
      res,
      next
    );

    expect(getSpy).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 502 }));
    getSpy.mockRestore();
    delete process.env.REPLICATE_API_TOKEN;
  });
});
