import type { Pool } from "mysql2/promise";
import mysql from "mysql2/promise";
const config = useRuntimeConfig();

let pool: Pool | null = null;

export const getDB = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      connectionLimit: 10,
    });
  }
  return pool;
};
