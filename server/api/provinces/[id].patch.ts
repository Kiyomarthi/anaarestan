import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { validate } from "~~/shared/validation";
import { validateBody } from "~~/server/utils/validate";
import { createError } from "h3";
import { CACHE_KEY } from "~~/shared/utils/cache";
import { removeCacheByPattern } from "~~/server/utils/cache";

/**
 * PATCH /api/provinces/:id
 * بروزرسانی استان (فقط ادمین)
 */
export default defineEventHandler(async (event) => {
  requireRole(event, "admin");
  const db = await getDB();
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "شناسه استان ارسال نشده است",
    });
  }

  await removeCacheByPattern(`${CACHE_KEY.province}:`);

  const [existingRows] = (await db.query(
    `SELECT * FROM provinces WHERE id = ?`,
    [id],
  )) as any[];
  const existing = existingRows?.[0] || null;

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "استان پیدا نشد",
    });
  }

  const body = await readBody(event);

  validateBody(body, {
    name: (v) => validate(v).min(2).max(191).run(),
    shipping_cost: (v) => validate(v).run(),
  });

  const sets: string[] = [];
  const params: any[] = [];

  if (body.name !== undefined) {
    sets.push("name = ?");
    params.push(String(body.name).trim());
  }

  if (body.shipping_cost !== undefined) {
    const cost =
      body.shipping_cost === null ? 0 : Number(body.shipping_cost);
    if (Number.isNaN(cost) || cost < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "هزینه ارسال نامعتبر است",
      });
    }
    sets.push("shipping_cost = ?");
    params.push(cost);
  }

  if (!sets.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "هیچ فیلدی برای بروزرسانی ارسال نشده است",
    });
  }

  params.push(id);

  try {
    await db.query(
      `UPDATE provinces SET ${sets.join(
        ", ",
      )}, updated_at = NOW() WHERE id = ?`,
      params,
    );
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      throw createError({
        statusCode: 409,
        statusMessage: "نام استان تکراری است",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || "خطا در بروزرسانی استان",
    });
  }

  const [rows] = (await db.query(`SELECT * FROM provinces WHERE id = ?`, [
    id,
  ])) as any[];

  return {
    success: true,
    message: "استان بروزرسانی شد",
    data: rows?.[0] || null,
  };
});


