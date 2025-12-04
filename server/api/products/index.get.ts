import { getDB } from "~~/server/db";
import { productFields } from "~~/server/utils/product";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const category = query.category as string;
  const search = query.search as string;

  const db = await getDB() as any;

  let whereClause = "1=1";
  const params: unknown[] = [];

  if (category) {
    whereClause += " AND category = ?";
    params.push(category);
  }

  if (search) {
    whereClause += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const [rows] = await db.execute(
    `SELECT ${productFields.join(", ")} FROM products WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await db.execute(
    `SELECT COUNT(*) as total FROM products WHERE ${whereClause}`,
    params
  );

  const total = (countRows as { total: number }[])[0]?.total || 0;

  return {
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
});
