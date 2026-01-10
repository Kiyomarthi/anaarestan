import { readMultipartFormData } from "h3";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

// This is a wrapper API that redirects to ImageKit API
// Kept for backward compatibility with existing components
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");

  const config = useRuntimeConfig();
  const imagekitUrl = config.imagekitUrl;
  const imagekitPrivateKey = config.imagekitPrivateKey;
  const imagekitPublicKey = config.imagekitPublicKey;

  if (!imagekitUrl || !imagekitPrivateKey || !imagekitPublicKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "ImageKit configuration is missing",
    });
  }

  const form = await readMultipartFormData(event);
  if (!form || !form.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "No file uploaded",
    });
  }

  const fileField = form.find((field) => field.filename);
  if (!fileField || !fileField.filename || !fileField.data) {
    throw createError({
      statusCode: 400,
      statusMessage: "No file found in request",
    });
  }

  // Prepare form data for ImageKit
  const formData = new FormData();
  formData.append("file", new Blob([fileField.data]), fileField.filename);
  formData.append("fileName", fileField.filename);
  formData.append("folder", "/");
  formData.append("useUniqueFileName", "true");

  try {
    const response = await $fetch("https://api.imagekit.io/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${imagekitPrivateKey}:`).toString(
          "base64"
        )}`,
      },
      body: formData,
    });

    // Return in the format expected by existing components
    // ImageKit returns url or filePath, we need to construct full URL
    const imagekitUrl = process.env.IMAGEKIT_URL || "";
    const fileUrl = response?.filePath || "";

    return {
      success: true,
      files: fileUrl ? [fileUrl] : [],
      data: response,
      url: fileUrl,
    };
  } catch (err: any) {
    console.error("[UPLOAD WRAPPER] error:", err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || "Upload failed",
      data: err.data || err,
    });
  }
});
