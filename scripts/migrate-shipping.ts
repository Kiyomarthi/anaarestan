import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.dev" });
loadEnv();

type DBRuntimeConfig = {
  db: {
    host?: string;
    user?: string;
    password?: string;
    database?: string;
  };
};

(globalThis as { useRuntimeConfig?: () => DBRuntimeConfig }).useRuntimeConfig = () => ({
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

async function main() {
  const requiredEnv = ["DB_HOST", "DB_USER", "DB_NAME"] as const;
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const { migrateShipping } = await import("../server/db/migrations/shipping");
  const { getDB } = await import("../server/db");

  await migrateShipping();
  await getDB().end();

  console.log("Shipping migration completed successfully.");
}

main().catch((error: unknown) => {
  console.error("Shipping migration failed:", error);
  process.exit(1);
});
