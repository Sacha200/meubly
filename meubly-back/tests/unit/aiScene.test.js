import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import request from "supertest";
import sharp from "sharp";
import { bearer, mockAuth } from "../helpers/authMock.js";

const storage = vi.hoisted(() => ({
  listBuckets: vi.fn(),
  createBucket: vi.fn(),
  from: vi.fn(),
}));
const supabase = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn(), storage }));
const replicateRun = vi.hoisted(() => vi.fn());
const axiosGet = vi.hoisted(() => vi.fn());

vi.mock("../../supabase.js", () => ({ supabase }));
vi.mock("replicate", () => ({ default: vi.fn(() => ({ run: replicateRun })) }));
vi.mock("axios", () => ({ default: { get: axiosGet } }));
vi.mock("../../repositories/userRepository.js", () => ({
  userRepository: { findRoleByUserId: vi.fn() },
}));
vi.mock("../../repositories/furnitureRepository.js", () => ({
  furnitureRepository: { findSummary: vi.fn() },
}));

const { app } = await import("../../app.js");
const { userRepository } = await import("../../repositories/userRepository.js");
const { furnitureRepository } = await import("../../repositories/furnitureRepository.js");
const { fetchAllowedImage } = await import("../../utils/imageFetch.js");

const FURNITURE = "3f2b6c1e-0000-4000-8000-000000000001";
const COVER = "https://www.ikea.com/fr/fr/images/products/chaise.jpg";
const GENERATED = "https://replicate.delivery/pbxt/abc/out.png";
let jpeg;

const imageResponse = () => ({
  status: 200,
  headers: { "content-type": "image/jpeg" },
  data: jpeg,
});
const generate = (body) =>
  request(app).post("/api/v1/ai/generate-scene").set("Authorization", bearer("user")).send(body);

describe("POST /ai/generate-scene", () => {
  beforeAll(async () => {
    jpeg = await sharp({
      create: { width: 8, height: 8, channels: 3, background: { r: 200, g: 150, b: 80 } },
    })
      .jpeg()
      .toBuffer();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    (await import("../../controllers/aiController.js")).__resetBucketStateForTests();
    process.env.REPLICATE_API_TOKEN = "test-token";
    mockAuth(supabase, userRepository);
    furnitureRepository.findSummary.mockResolvedValue({
      furniture_id: FURNITURE,
      cover_url: COVER,
    });
    storage.listBuckets.mockResolvedValue({ data: [{ name: "ai-generated" }], error: null });
    storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "https://cdn.example/x.jpg" } }),
    });
    replicateRun.mockResolvedValue([GENERATED]);
    axiosGet.mockResolvedValue(imageResponse());
  });

  it("400 si le client envoie encore une URL libre", async () => {
    expect((await generate({ imageUrl: COVER, prompt: "salon" })).status).toBe(400);
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it("400 pour un prompt de plus de 200 caracteres", async () => {
    expect((await generate({ furnitureId: FURNITURE, prompt: "x".repeat(201) })).status).toBe(400);
  });

  it("404 pour un meuble inconnu", async () => {
    furnitureRepository.findSummary.mockResolvedValue(null);
    expect((await generate({ furnitureId: FURNITURE, prompt: "salon" })).status).toBe(404);
  });

  it("refuse une image hebergee hors liste blanche sans la telecharger", async () => {
    furnitureRepository.findSummary.mockResolvedValue({
      furniture_id: FURNITURE,
      cover_url: "http://169.254.169.254/latest/meta-data",
    });
    expect((await generate({ furnitureId: FURNITURE, prompt: "salon" })).status).toBe(400);
    expect(axiosGet).not.toHaveBeenCalled();
    expect(replicateRun).not.toHaveBeenCalled();
  });

  it("refuse une reponse qui n'est pas une image, sans appeler Replicate", async () => {
    axiosGet.mockResolvedValue({ status: 200, headers: { "content-type": "text/html" }, data: "" });
    expect((await generate({ furnitureId: FURNITURE, prompt: "salon" })).status).toBe(400);
    expect(replicateRun).not.toHaveBeenCalled();
  });

  it("502 si la source redirige (redirections non suivies)", async () => {
    axiosGet.mockRejectedValue(Object.assign(new Error("redirect"), { response: { status: 302 } }));
    const res = await generate({ furnitureId: FURNITURE, prompt: "salon" });
    expect(res.status).toBe(502);
    expect(replicateRun).not.toHaveBeenCalled();
  });

  it("genere la scene a partir de l'image du meuble", async () => {
    const res = await generate({ furnitureId: FURNITURE, prompt: "  salon scandinave " });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ url: "https://cdn.example/x.jpg", source: "supabase" });
    expect(replicateRun).toHaveBeenCalledTimes(1);
    expect(axiosGet).toHaveBeenCalledWith(
      COVER,
      expect.objectContaining({ maxRedirects: 0, maxContentLength: 10 * 1024 * 1024 })
    );
  });
});

describe("fetchAllowedImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("n'accepte que https sur un hote autorise", async () => {
    const opts = { allowedHosts: ["www.ikea.com"] };
    await expect(fetchAllowedImage("http://www.ikea.com/a.jpg", opts)).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(fetchAllowedImage("https://evil.example/a.jpg", opts)).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(
      fetchAllowedImage("https://www.ikea.com.evil.example/a.jpg", opts)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it("accepte un suffixe de domaine declare avec un point", async () => {
    axiosGet.mockResolvedValue(imageResponse());
    await expect(
      fetchAllowedImage(GENERATED, { allowedHosts: [".replicate.delivery"] })
    ).resolves.toBeInstanceOf(Buffer);
  });

  it("502 si l'image depasse la taille maximale", async () => {
    axiosGet.mockRejectedValue(
      Object.assign(new Error("maxContentLength size of 10 exceeded"), { code: "ERR_BAD_RESPONSE" })
    );
    await expect(
      fetchAllowedImage(COVER, { allowedHosts: ["www.ikea.com"], maxBytes: 10 })
    ).rejects.toMatchObject({ statusCode: 502 });
  });
});
