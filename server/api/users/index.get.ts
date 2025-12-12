import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";
import { userFields } from "~~/server/utils/user";
import { JwtPayload } from "jsonwebtoken";

export default defineEventHandler(async (event) => {
  const user = requireRole(event, "admin");

  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit =
    parseInt(query.limit as string) || parseInt(query.perPage as string) || 10;
  const offset = (page - 1) * limit;
  const search = query.search as string;

  const db = (await getDB()) as any;

  let whereClause = "1=1";
  const params: unknown[] = [];

  if (search) {
    whereClause += " AND (full_name LIKE ? OR phone LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  // Some MySQL drivers do not accept binding for LIMIT/OFFSET placeholders reliably.
  // Inline validated numeric values for LIMIT/OFFSET to avoid "Incorrect arguments" errors.
  const selectSql = `SELECT ${userFields.join(
    ", "
  )} FROM users WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  const [rows] = await db.execute(selectSql, params);

  const [countRows] = await db.execute(
    `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
    params
  );

  const total = (countRows as { total: number }[])[0]?.total || 0;

  return {
    success: true,
    data: rows,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
});
