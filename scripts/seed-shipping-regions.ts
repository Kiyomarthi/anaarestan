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

type ProvinceRecord = {
  id: number | string;
  name?: string;
  title?: string;
};

type CityRecord = {
  id: number | string;
  province_id: number | string;
  name?: string;
  title?: string;
};

// Source dataset:
// https://github.com/mhndev/iran-geography
const PROVINCES_URL =
  "https://raw.githubusercontent.com/mhndev/iran-geography/master/province.json";
const CITIES_URL =
  "https://raw.githubusercontent.com/mhndev/iran-geography/master/cities.json";

(globalThis as { useRuntimeConfig?: () => DBRuntimeConfig }).useRuntimeConfig = () => ({
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

const asName = (item: { name?: string; title?: string }) =>
  String(item.name || item.title || "").trim();

function tryParseJson<T>(text: string): T {
  const raw = text.replace(/^\uFEFF/, "").trim();

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Some upstream datasets occasionally ship trailing commas and break strict JSON parsing.
    const normalized = raw.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(normalized) as T;
  }
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const text = await response.text();

  try {
    return tryParseJson<T>(text);
  } catch (error: unknown) {
    throw new Error(
      `Failed to parse dataset JSON from ${url}. ${(error as Error)?.message || "Unknown parse error"}`,
    );
  }
}

async function main() {
  const requiredEnv = ["DB_HOST", "DB_USER", "DB_NAME"] as const;
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  const [{ migrateShipping }, { getDB }] = await Promise.all([
    import("../server/db/migrations/shipping"),
    import("../server/db"),
  ]);

  await migrateShipping();

  const [provincesPayload, citiesPayload] = await Promise.all([
    getJson<ProvinceRecord[]>(PROVINCES_URL),
    getJson<CityRecord[]>(CITIES_URL),
  ]);

  const provinces = provincesPayload
    .map((item) => ({
      sourceId: Number(item.id),
      name: asName(item),
    }))
    .filter((item) => item.name.length > 0);

  const cities = citiesPayload
    .map((item) => ({
      sourceId: Number(item.id),
      provinceSourceId: Number(item.province_id),
      name: asName(item),
    }))
    .filter((item) => item.name.length > 0 && !Number.isNaN(item.provinceSourceId));

  if (!provinces.length || !cities.length) {
    throw new Error("Invalid region dataset: provinces/cities are empty.");
  }

  const provinceBySourceId = new Map<number, string>();
  for (const province of provinces) {
    provinceBySourceId.set(province.sourceId, province.name);
  }

  const db = await getDB();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const province of provinces) {
      await connection.query(
        `
          INSERT INTO provinces (name, shipping_cost, created_at, updated_at)
          VALUES (?, 0, NOW(), NOW())
          ON DUPLICATE KEY UPDATE updated_at = NOW()
        `,
        [province.name],
      );
    }

    const [provinceRows] = (await connection.query(
      `SELECT id, name FROM provinces`,
    )) as any[];

    const dbProvinceIdByName = new Map<string, number>();
    for (const row of provinceRows || []) {
      dbProvinceIdByName.set(String(row.name), Number(row.id));
    }

    const existingCityByProvince = new Map<number, Set<string>>();
    const [cityRows] = (await connection.query(
      `SELECT province_id, name FROM cities`,
    )) as any[];

    for (const row of cityRows || []) {
      const provinceId = Number(row.province_id);
      const cityName = String(row.name);
      if (!existingCityByProvince.has(provinceId)) {
        existingCityByProvince.set(provinceId, new Set<string>());
      }
      existingCityByProvince.get(provinceId)?.add(cityName);
    }

    let insertedCities = 0;
    for (const city of cities) {
      const provinceName = provinceBySourceId.get(city.provinceSourceId);
      if (!provinceName) continue;

      const provinceId = dbProvinceIdByName.get(provinceName);
      if (!provinceId) continue;

      if (!existingCityByProvince.has(provinceId)) {
        existingCityByProvince.set(provinceId, new Set<string>());
      }

      const citySet = existingCityByProvince.get(provinceId)!;
      if (citySet.has(city.name)) continue;

      await connection.query(
        `
          INSERT INTO cities (province_id, name, shipping_cost, created_at, updated_at)
          VALUES (?, ?, NULL, NOW(), NOW())
        `,
        [provinceId, city.name],
      );
      citySet.add(city.name);
      insertedCities += 1;
    }

    await connection.commit();
    console.log(
      `Regions seeded successfully. Provinces: ${provinces.length}, inserted cities: ${insertedCities}`,
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error("Seeding regions failed:", error);
  process.exit(1);
});
