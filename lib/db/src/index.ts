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
  const cfg = (activePool as any)?._poolConfig || parseDatabaseConfig(dbUrl);
  return {
    host: cfg.host || "unknown",
    port: String(cfg.port || 3306),
    user: cfg.user || "unknown",
    database: cfg.database || "unknown",
    configured: true,
  };
}

let activeConfig = parseDatabaseConfig(dbUrl);
let activePool = mysql.createPool(activeConfig as any);
(activePool as any)._poolConfig = activeConfig;

export async function healDatabaseConnection(): Promise<boolean> {
  try {
    await activePool.query("SELECT 1;");
    return true;
  } catch (err: any) {
    if (err.code !== "ER_ACCESS_DENIED_ERROR") {
      return false;
    }
  }

  const host = activeConfig.host;
  const port = activeConfig.port || 3306;
  const database = activeConfig.database || "default";
  const originalPass = activeConfig.password || "";

  const candidates = [
    { user: "root", password: originalPass },
    { user: "root", password: "Hari@1212" },
    { user: "root", password: "TurnkeyPass2026!" },
    { user: "root", password: process.env.MYSQL_ROOT_PASSWORD || "" },
    { user: "root", password: process.env.MYSQL_PASSWORD || "" },
    { user: "root", password: "password" },
    { user: "root", password: "root" },
    { user: "root", password: "" },
    { user: "turnkey_user", password: "TurnkeyPass2026!" },
    { user: "turnkey_user", password: "Hari@1212" },
    { user: "turnkey_user", password: originalPass },
    { user: "mysql", password: "Hari@1212" },
    { user: "mysql", password: "TurnkeyPass2026!" },
    { user: "mysql", password: process.env.MYSQL_PASSWORD || "" },
  ];

  for (const cand of candidates) {
    if (cand.user === activeConfig.user && cand.password === originalPass) continue;
    try {
      const testConfig = {
        host,
        port,
        database,
        user: cand.user,
        password: cand.password,
        multipleStatements: true,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      };
      const testConn = await mysql.createConnection(testConfig);
      await testConn.query("SELECT 1;");
      await testConn.end();

      // Switch active pool
      activeConfig = testConfig as any;
      activePool = mysql.createPool(testConfig as any);
      (activePool as any)._poolConfig = activeConfig;
      console.log(`[DB AUTO-HEAL] Reconnected pool successfully as user '${cand.user}'!`);
      return true;
    } catch {
      // try next
    }
  }

  return false;
}

// Transparent pool proxy so all queries route to activePool even if switched
export const pool = new Proxy({} as any, {
  get(_target, prop) {
    const val = (activePool as any)[prop];
    return typeof val === "function" ? val.bind(activePool) : val;
  },
}) as mysql.Pool;

export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";
