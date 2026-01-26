export default defineEventHandler(async (event) => {
  const { url } = getQuery(event);

  if (!url || typeof url !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing url",
    });
  }

  try {
    const res = await fetch(url, {
      redirect: "follow",
    });

    if (!res.ok) {
      throw createError({
        statusCode: res.status,
        statusMessage: "Remote fetch failed",
      });
    }

    const contentType =
      res.headers.get("content-type") || "application/octet-stream";

    const contentLength = res.headers.get("content-length");

    const buffer = await res.arrayBuffer();

    setHeader(event, "Content-Type", contentType);

    if (contentLength) {
      setHeader(event, "Content-Length", contentLength);
    }

    setHeader(event, "Cache-Control", "no-store");

    return Buffer.from(buffer);
  } catch (err: any) {
    console.error("Proxy error:", err);

    throw createError({
      statusCode: 500,
      statusMessage: "Proxy download failed",
    });
  }
});
