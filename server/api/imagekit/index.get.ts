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

  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const searchQuery = query.search as string | undefined;
  const fileType = query.fileType as string | undefined;
  const sort = (query.sort as string) || "ASC_CREATED";
  const path = query.path as string | undefined;
  const tags = query.tags as string | undefined;

  // Build query parameters for ImageKit API
  const params: Record<string, string> = {
    skip: ((page - 1) * limit).toString(),
    limit: limit.toString(),
    sort: sort,
  };

  if (searchQuery) {
    params.searchQuery = searchQuery;
  }
  if (fileType) {
    params.type = fileType;
  }
  if (path) {
    params.path = path;
  }
  if (tags) {
    params.tags = tags;
  }

  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await $fetch<{
      files?: any[];
      [key: string]: any;
    }>(`https://api.imagekit.io/v1/files?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${imagekitPrivateKey}:`).toString(
          "base64"
        )}`,
        Accept: "application/json",
      },
    });

    // ImageKit returns files array directly or in a files property
    const files = Array.isArray(response) ? response : response.files || [];
    const total = Array.isArray(response)
      ? response.length
      : (response as any).totalCount || files.length;

    return {
      success: true,
      data: files,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    console.error("[IMAGEKIT LIST] error:", err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.message || "Failed to fetch files",
      data: err.data || err,
    });
  }
});
