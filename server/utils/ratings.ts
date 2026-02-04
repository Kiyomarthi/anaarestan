import type { Pool } from "mysql2/promise";

export async function recalculateProductRatings(db: Pool, productId: number) {
  const [rows] = (await db.query(
    `SELECT AVG(rating) AS avg_rating, COUNT(*) AS rating_count
     FROM comments
     WHERE product_id = ? AND status = 1`,
    [productId]
  )) as any[];

  const avg = rows?.[0]?.avg_rating ?? 0;
  const count = rows?.[0]?.rating_count ?? 0;

  const avg1 = Math.round(Number(avg || 0) * 10) / 10;
  const ratingCount = Number(count || 0);

  await db.query(
    `INSERT INTO product_ratings (product_id, avg_rating, rating_count, updated_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       avg_rating = VALUES(avg_rating),
       rating_count = VALUES(rating_count),
       updated_at = NOW()`,
    [productId, avg1, ratingCount]
  );

  return { avg_rating: avg1, rating_count: ratingCount };
}


