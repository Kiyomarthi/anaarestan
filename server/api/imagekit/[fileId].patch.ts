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

  const body = await readBody(event);
  const { tags, customCoordinates, customMetadata } = body;

  // Build update payload
  const updateData: Record<string, any> = {};

  if (tags !== undefined) {
    // ImageKit expects tags as an array of strings
    if (Array.isArray(tags)) {
      updateData.tags = tags.filter((t) => t && t.trim());
    } else if (typeof tags === "string") {
      // If it's a comma-separated string, split it
      updateData.tags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    } else {
      updateData.tags = [];
    }
  }
  if (customCoordinates !== undefined) {
    updateData.customCoordinates = customCoordinates;
  }
  if (customMetadata !== undefined) {
    updateData.customMetadata = customMetadata;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No fields to update",
    });
  }

  try {
    const response = await $fetch(
      `https://api.imagekit.io/v1/files/${fileId}/details`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${imagekitPrivateKey}:`
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: updateData,
      }
    );

    return {
      success: true,
      message: "File updated successfully",
      data: response,
    };
  } catch (err: any) {
    console.error("[IMAGEKIT UPDATE] error:", err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || "Failed to update file",
      data: err.data || err,
    });
  }
});
