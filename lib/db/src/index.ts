import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error(
    "FATAL ERROR: DATABASE_URL is not set!\n" +
    "Please go to your Coolify application settings -> Environment Variables\n" +
    "and set DATABASE_URL (e.g. mysql://user:pass@host:3306/dbname)"
  );
  throw new Error(
    "DATABASE_URL must be set. Please configure DATABASE_URL in your server/Coolify Environment Variables."
  );
}

export function parseDatabaseConfig(urlStr: string) {
  try {
    const url = new URL(urlStr);
    return {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, "") || "default",
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 7000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    };
  } catch {
    return {
      uri: urlStr,
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 7000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    };
  }
}

export function getSanitizedDbInfo() {
  const cfg = parseDatabaseConfig(dbUrl);
  return {
    host: cfg.host || "unknown",
    port: String(cfg.port || 3306),
    user: cfg.user || "unknown",
    database: cfg.database || "unknown",
    configured: true,
  };
}

const poolConfig = parseDatabaseConfig(dbUrl);

export const pool = mysql.createPool(poolConfig as any);
export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";
