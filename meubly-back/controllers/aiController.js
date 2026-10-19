import { supabase } from "../supabase.js";
import sharp from "sharp";
import Replicate from "replicate";
import { furnitureRepository } from "../repositories/furnitureRepository.js";
import { fetchAllowedImage, getAllowedImageHosts } from "../utils/imageFetch.js";
import { httpError } from "../utils/httpError.js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const BUCKET_NAME = "ai-generated";

let bucketPromise = null;

const isAlreadyExists = (error) =>
  error?.status === 409 || /already exists/i.test(error?.message || "");

// supabase-js ne leve pas sur erreur HTTP : il renvoie { data, error }.
async function ensureBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`[AI] Cannot list buckets: ${listError.message}`);
  if (buckets?.some((b) => b.name === BUCKET_NAME)) return;
  const { error } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
  if (error && !isAlreadyExists(error)) {
    throw new Error(`[AI] Failed to create bucket "${BUCKET_NAME}": ${error.message}`);
  }
}

/**
 * Garantit l'existence du bucket au premier usage (et non a l'import).
 * Les appels concurrents partagent la meme promesse ; un echec n'est pas memorise.
 * @returns {Promise<void>}
 */
export function ensureBucketOnce() {
  if (!bucketPromise) {
    bucketPromise = ensureBucket().catch((err) => {
      bucketPromise = null;
      throw err;
    });
  }
  return bucketPromise;
}

/** Reinitialise l'etat memoise. Reserve aux tests. */
export function __resetBucketStateForTests() {
  bucketPromise = null;
}

export const aiController = {
  /**
   * Genere une mise en scene a partir de l'image de couverture d'un meuble.
   * Corps valide a la route : { furnitureId: uuid, prompt: 3-200 caracteres }.
   * L'image est lue en base (jamais une URL fournie par le client) puis telechargee
   * uniquement depuis un hote autorise.
   */
  async generateScene(req, res, next) {
    try {
      const { furnitureId, prompt } = req.body;

      if (!process.env.REPLICATE_API_TOKEN) {
        throw httpError(503, "Generation indisponible");
      }

      const furniture = await furnitureRepository.findSummary(furnitureId);
      if (!furniture?.cover_url) throw httpError(404, "Meuble ou image introuvable");

      // Non bloquant : sans bucket, l'upload echoue et on renvoie l'URL Replicate (repli plus bas).
      await ensureBucketOnce().catch((err) => console.error(err.message));

      // 1. Image source (en Docker local, Storage est joignable via kong et non localhost)
      const sourceUrl =
        process.env.NODE_ENV !== "production"
          ? furniture.cover_url.replace("://localhost", "://kong")
          : furniture.cover_url;
      const originalBuffer = await fetchAllowedImage(sourceUrl, {
        allowedHosts: getAllowedImageHosts(),
      });

      // 2. Optimize image with sharp (max 1024px for Replicate inpainting model)
      const optimizedBuffer = await sharp(originalBuffer)
        .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // 3. Create a full white mask (same size as optimized image)
      const { width: optW, height: optH } = await sharp(optimizedBuffer).metadata();
      const maskBuffer = await sharp({
        create: { width: optW, height: optH, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .jpeg()
        .toBuffer();

      // 4. Convert to base64 data URIs for Replicate
      const imageBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;
      const maskBase64 = `data:image/jpeg;base64,${maskBuffer.toString("base64")}`;

      // 5. Call Replicate (stability-ai/stable-diffusion-inpainting)
      const output = await replicate.run(
        "stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
        {
          input: {
            image: imageBase64,
            mask: maskBase64,
            prompt: `A ${prompt}, professional furniture photography, photorealistic, high quality, soft lighting`,
            negative_prompt: "blurry, low quality, distorted, deformed furniture, ugly, watermark",
            num_inference_steps: 25,
            guidance_scale: 7.5,
            strength: 0.85,
          },
        }
      );

      // Handle both old SDK (string/array of strings) and new SDK (FileOutput objects)
      const first = Array.isArray(output) ? output[0] : output;
      const generatedUrl =
        typeof first?.url === "function" ? first.url().toString() : String(first);
      if (!first || !generatedUrl || generatedUrl === "undefined") {
        throw httpError(502, "Generation impossible");
      }

      // 6. Download generated image from Replicate (hote Replicate uniquement)
      const generatedBuffer = await fetchAllowedImage(generatedUrl, {
        allowedHosts: [".replicate.delivery"],
      });

      // 7. Upload to Supabase Storage bucket
      const filename = `${Date.now()}_lifestyle.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, generatedBuffer, { contentType: "image/jpeg", upsert: false });

      if (uploadError) {
        console.error("[AI] Supabase upload error:", uploadError.message);
        return res.status(200).json({ url: generatedUrl, prompt, source: "replicate_direct" });
      }

      // 8. Get permanent public URL from Supabase (kong -> localhost pour le navigateur en local)
      const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);
      const publicUrl = publicUrlData.publicUrl.replace("http://kong:", "http://localhost:");

      return res.status(200).json({ url: publicUrl, prompt, source: "supabase" });
    } catch (error) {
      return next(error);
    }
  },
};
