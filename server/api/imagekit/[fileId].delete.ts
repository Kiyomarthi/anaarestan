import { requireRole } from "~~/server/utils/permissions";
import { createError } from "h3";

export default defineEventHandler(async (event) => {
  requireRole(event, "admin");

  const config = useRuntimeConfig();
  const imagekitPrivateKey = config.imagekitPrivateKey;

  if (!imagekitPrivateKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "ImageKit configuration is missing",
    });
  }

  const fileId = getRouterParam(event, "fileId");

  if (!fileId) {
    throw createError({
      statusCode: 400,
      statusMessage: "File ID is required",
    });
  }

  try {
    const response = await $fetch(
      `https://api.imagekit.io/v1/files/${fileId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${imagekitPrivateKey}:`
          ).toString("base64")}`,
        },
      }
    );

    return {
      success: true,
      message: "File deleted successfully",
      data: response,
    };
  } catch (err: any) {
    console.error("[IMAGEKIT DELETE] error:", err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || "Failed to delete file",
      data: err.data || err,
    });
  }
});
