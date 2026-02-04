import { getDB } from "~~/server/db";
import { defineCronHandler } from "#nuxt/cron";

export default defineCronHandler("hourly", async () => {
  const db = await getDB();
  console.log("Running cart cleanup...");
  await db.query(`
    UPDATE carts
    SET status = 'abandoned'
    WHERE status = 'active'
    AND updated_at < NOW() - INTERVAL 48 HOUR
  `);
});
