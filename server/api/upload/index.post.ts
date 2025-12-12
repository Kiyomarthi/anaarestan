import { readMultipartFormData } from "h3";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);

  if (!form) {
    return { success: false, message: "No file uploaded" };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const savedFiles: string[] = [];

  for (const field of form) {
    // 🔥 فیلد فایل فقط اگر filename داشت
    if (field.filename && field.data) {
      const MAX_SIZE = 300 * 1024;

      if (field.data.length > MAX_SIZE) {
        throw createError({
          statusCode: 400,
          statusMessage: "File too large. Max size is 300KB",
        });
      }

      const originalName = field.filename;
      const ext = path.extname(originalName);
      const base = path.basename(originalName, ext);

      let safeName = base.length > 40 ? base.slice(0, 40) : base;

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

      savedFiles.push(`/uploads/${fileName}`);
    }
  }

  return {
    success: true,
    files: savedFiles,
  };
});
