// server/api/categories/get.ts
import { JwtPayload } from "jsonwebtoken";
import { getDB } from "~~/server/db";
import { requireAuth } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const db = await getDB();
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const all = query.all === "true";
  const search = query.search ? `%${query.search}%` : null;

  const user = (await requireAuth(event)) as JwtPayload;

  let sql = "SELECT * FROM categories";
  const params: any[] = [];

  const conditions: string[] = [];

  if (search) {
    conditions.push("name LIKE ?");
    params.push(search);
  }

  if (!(all && user.role === "admin")) {
    conditions.push("status = 1");
  }

  if (conditions.length) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY id ASC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const categories = (await db.query(sql, params)) as any[];

  const map = new Map();
  categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

  const tree: any[] = [];
  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id).children.push(cat);
    } else {
      tree.push(cat);
    }
  });

  let countSql = "SELECT COUNT(*) as total FROM categories";
  const countParams: any[] = [];
  if (conditions.length) {
    countSql += " WHERE " + conditions.join(" AND ");
    countParams.push(...params.slice(0, params.length - 2));
  }
  const countResult = (await db.query(countSql, countParams)) as any[];
  const total = countResult[0].total;

  const meta = { total, page, limit };

  return {
    meta,
    data: tree,
  };
});
