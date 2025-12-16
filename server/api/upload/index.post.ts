import { readMultipartFormData } from "h3";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const uploadDir = config.uploadDir;
  const uploadUrl = config.uploadUrl;

  console.log("[UPLOAD] request received");

  const form = await readMultipartFormData(event);
  if (!form) {
    console.error("[UPLOAD] no form data");
    return { success: false, message: "No file uploaded" };
  }

  console.log("[UPLOAD] fields:", form.length);
  console.log("[UPLOAD] uploadDir:", uploadDir);

  await fs.mkdir(uploadDir, { recursive: true });

  const savedFiles: string[] = [];

  for (const field of form) {
    if (!field.filename || !field.data) continue;

    console.log("[UPLOAD] processing:", field.filename);

    if (field.data.length > 300 * 1024) {
      console.error("[UPLOAD] file too large:", field.filename);
      throw createError({ statusCode: 400, statusMessage: "File too large" });
    }

    const base = path.basename(field.filename, path.extname(field.filename));
    const fileName = `${base.slice(0, 40)}-${Date.now()}.webp`;
    const filePath = path.join(uploadDir, fileName);

    try {
      await sharp(field.data).webp({ quality: 80 }).toFile(filePath);
      console.log("[UPLOAD] saved:", filePath);
      savedFiles.push(`${uploadUrl}/${fileName}`);
    } catch (err) {
      console.error("[UPLOAD] sharp error:", err);
      throw createError({
        statusCode: 500,
        statusMessage: "Image processing failed",
      });
    }
  }

  console.log("[UPLOAD] done:", savedFiles);

  return { success: true, files: savedFiles };
});
