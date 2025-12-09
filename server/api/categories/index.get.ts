import { getDB } from "~~/server/db";

export default defineEventHandler(async () => {
  const db = await getDB();

  const [rows] = await db.query("SELECT * FROM categories ORDER BY id ASC");

  const map = new Map<number, any>();

  rows?.forEach((row: any) => {
    map.set(row.id, { ...row, children: [] });
  });

  const tree: any[] = [];

  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id).children.push(cat);
    } else {
      tree.push(cat);
    }
  });

  return {
    success: true,
    data: tree,
  };
});
