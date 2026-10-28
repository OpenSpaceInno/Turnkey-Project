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

export const pool = mysql.createPool({
  uri: dbUrl,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";
