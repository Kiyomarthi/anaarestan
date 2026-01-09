import { readMultipartFormData } from "h3";
import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

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

  console.log("[IMAGEKIT UPLOAD] request received");

  const form = await readMultipartFormData(event);
  if (!form || !form.length) {
    console.error("[IMAGEKIT UPLOAD] no form data");
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

  console.log("[IMAGEKIT UPLOAD] processing:", fileField.filename);

  // Get additional parameters from form
  const folderField = form.find((field) => field.name === "folder");
  const fileNameField = form.find((field) => field.name === "fileName");
  const tagsField = form.find((field) => field.name === "tags");
  const useUniqueFileNameField = form.find(
    (field) => field.name === "useUniqueFileName"
  );

  const folder = folderField?.data?.toString() || "/";
  const fileName = fileNameField?.data?.toString() || fileField.filename;
  const tags = tagsField?.data?.toString() || undefined;
  const useUniqueFileName =
    useUniqueFileNameField?.data?.toString() === "true" || true;

  // Prepare form data for ImageKit
  const formData = new FormData();
  formData.append("file", new Blob([fileField.data]), fileField.filename);
  formData.append("fileName", fileName);
  formData.append("folder", folder);
  if (tags) {
    formData.append("tags", tags);
  }
  formData.append("useUniqueFileName", useUniqueFileName.toString());

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

    console.log("[IMAGEKIT UPLOAD] success:", response);

    return {
      success: true,
      message: "File uploaded successfully",
      data: response,
    };
  } catch (err: any) {
    console.error("[IMAGEKIT UPLOAD] error:", err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || "Upload failed",
      data: err.data || err,
    });
  }
});
