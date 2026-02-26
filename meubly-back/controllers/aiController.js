import axios from 'axios';
import { supabase } from '../supabase.js';
import sharp from 'sharp';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const BUCKET_NAME = 'ai-generated';

// Ensure the bucket exists at startup (creates it if missing)
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET_NAME);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    if (error) {
      console.error(`[AI] Failed to create bucket "${BUCKET_NAME}":`, error.message);
    } else {
      console.log(`[AI] Bucket "${BUCKET_NAME}" created successfully.`);
    }
  }
}

ensureBucket();

export const aiController = {
  async generateScene(req, res) {
    try {
      const { imageUrl, prompt } = req.body;

      if (!imageUrl || !prompt) {
        return res.status(400).json({ error: 'imageUrl and prompt are required' });
      }

      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: 'Replicate API token not configured' });
      }

      // 1. Download source image (Docker fix: localhost -> kong for Supabase Storage)
      let downloadUrl = imageUrl;
      if (imageUrl.includes('localhost')) {
        downloadUrl = imageUrl.replace('localhost', 'kong');
        console.log(`[AI] Docker fix: ${imageUrl} -> ${downloadUrl}`);
      }

      console.log(`[AI] Downloading image from: ${downloadUrl}`);
      const imageResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });

      const contentType = imageResponse.headers['content-type'] || '';
      console.log(`[AI] Downloaded. Status: ${imageResponse.status}, Type: ${contentType}, Size: ${imageResponse.data.length} bytes`);

      if (contentType.includes('text/html')) {
        throw new Error('Downloaded source is not an image (HTML response)');
      }

      // 2. Optimize image with sharp (max 1024px for Replicate inpainting model)
      const originalBuffer = Buffer.from(imageResponse.data);

      const optimizedBuffer = await sharp(originalBuffer)
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      console.log(`[AI] Optimized: ${originalBuffer.length} -> ${optimizedBuffer.length} bytes`);

      // 3. Create a full white mask (same size as optimized image)
      const { width: optW, height: optH } = await sharp(optimizedBuffer).metadata();
      const maskBuffer = await sharp({
        create: { width: optW, height: optH, channels: 3, background: { r: 255, g: 255, b: 255 } }
      })
        .jpeg()
        .toBuffer();

      // 4. Convert to base64 data URIs for Replicate
      const imageBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
      const maskBase64 = `data:image/jpeg;base64,${maskBuffer.toString('base64')}`;

      // 5. Call Replicate (stability-ai/stable-diffusion-inpainting)
      console.log(`[AI] Calling Replicate with prompt: "${prompt}"`);
      const output = await replicate.run(
        'stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
        {
          input: {
            image: imageBase64,
            mask: maskBase64,
            prompt: `A ${prompt}, professional furniture photography, photorealistic, high quality, soft lighting`,
            negative_prompt: 'blurry, low quality, distorted, deformed furniture, ugly, watermark',
            num_inference_steps: 25,
            guidance_scale: 7.5,
            strength: 0.85,
          }
        }
      );

      console.log(`[AI] Replicate raw output type: ${typeof output}`, Array.isArray(output) ? `array[${output.length}]` : '');

      // Handle both old SDK (string/array of strings) and new SDK (FileOutput objects)
      let generatedUrl;
      if (Array.isArray(output) && output.length > 0) {
        const first = output[0];
        // New SDK: FileOutput has a .url() method
        generatedUrl = typeof first?.url === 'function' ? first.url().toString() : String(first);
      } else if (output) {
        generatedUrl = typeof output?.url === 'function' ? output.url().toString() : String(output);
      }

      console.log(`[AI] Generated URL: ${generatedUrl}`);

      if (!generatedUrl || generatedUrl === 'undefined') {
        throw new Error('Replicate returned no usable output URL');
      }

      // 6. Download generated image from Replicate
      const generatedResponse = await axios.get(generatedUrl, { responseType: 'arraybuffer' });
      const generatedBuffer = Buffer.from(generatedResponse.data);

      // 7. Upload to Supabase Storage bucket
      const filename = `${Date.now()}_lifestyle.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, generatedBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('[AI] Supabase upload error:', uploadError.message);
        // Fallback: return Replicate URL directly
        return res.status(200).json({
          url: generatedUrl,
          originalUrl: imageUrl,
          prompt,
          source: 'replicate_direct'
        });
      }

      // 8. Get permanent public URL from Supabase
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filename);

      // FIX: Replace internal Docker URL (kong) with public URL (localhost) for the browser
      const publicUrl = publicUrlData.publicUrl.replace('http://kong:', 'http://localhost:');

      console.log(`[AI] Uploaded to Supabase: ${publicUrl}`);

      res.status(200).json({
        url: publicUrl,
        originalUrl: imageUrl,
        prompt,
        source: 'supabase'
      });

    } catch (error) {
      const errorMsg = error.response?.data
        ? new TextDecoder().decode(error.response.data)
        : error.message;
      console.error('[AI] Generation Error:', errorMsg);
      res.status(500).json({
        error: 'Failed to generate scene',
        details: errorMsg
      });
    }
  }
};
