import { readMultipartFormData } from "h3";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const uploadDir = config.uploadDir;
  const uploadUrl = config.uploadUrl;

  const form = await readMultipartFormData(event);
  if (!form) return { success: false, message: "No file uploaded" };

  await fs.mkdir(uploadDir, { recursive: true });

  const savedFiles: string[] = [];

  for (const field of form) {
    if (field.filename && field.data) {
      const MAX_SIZE = 300 * 1024;
      if (field.data.length > MAX_SIZE) {
        throw createError({
          statusCode: 400,
          statusMessage: "File too large. Max size is 300KB",
        });
      }

      const ext = path.extname(field.filename);
      const base = path.basename(field.filename, ext);
      const safeName = base.length > 40 ? base.slice(0, 40) : base;
      const fileName = `${safeName}-${Date.now()}.webp`;
      const filePath = path.join(uploadDir, fileName);

      try {
        await sharp(field.data).webp({ quality: 80 }).toFile(filePath);
      } catch (err) {
        console.error("SHARP ERROR:", err);
        throw createError({
          statusCode: 500,
          statusMessage: "Sharp failed to process image",
        });
      }
      savedFiles.push(`${uploadUrl}/${fileName}`);
    }
  }

  return { success: true, files: savedFiles };
});
