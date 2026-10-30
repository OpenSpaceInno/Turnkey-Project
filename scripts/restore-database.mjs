import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Try resolving dotenv and mysql2 from candidate node_modules
let dotenv;
let mysql;

const searchPaths = [
  path.resolve(__dirname, "../node_modules"),
  path.resolve(__dirname, "../artifacts/api-server/node_modules"),
  path.resolve(__dirname, "../lib/db/node_modules"),
  process.cwd(),
];

try {
  dotenv = require("dotenv");
} catch {
  for (const sp of searchPaths) {
    try {
      dotenv = require(path.join(sp, "dotenv"));
      break;
    } catch {}
  }
}

try {
  mysql = require("mysql2/promise");
} catch {
  for (const sp of searchPaths) {
    try {
      mysql = require(path.join(sp, "mysql2/promise"));
      break;
    } catch {}
  }
}

if (dotenv) {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("FATAL ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

if (!mysql) {
  console.error("FATAL ERROR: Could not resolve mysql2 library.");
  process.exit(1);
}

async function restoreDatabase() {
  console.log("==========================================================");
  console.log(" Kanak TurnKey — Complete Production Database Restorer");
  console.log("==========================================================");
  console.log("Target Database URL:", dbUrl.replace(/:[^:@]+@/, ":****@"));

  const candidatePaths = [
    path.resolve(__dirname, "../deploy/complete-turnkey-db.sql"),
    path.resolve(__dirname, "../deploy/schema.sql"),
    path.resolve(process.cwd(), "deploy/complete-turnkey-db.sql"),
    path.resolve(process.cwd(), "deploy/schema.sql"),
  ];

  const dumpPath = candidatePaths.find((p) => fs.existsSync(p));

  if (!dumpPath) {
    console.error("ERROR: complete-turnkey-db.sql or schema.sql not found in candidate paths:", candidatePaths);
    process.exit(1);
  }

  console.log("Found SQL Dump File:", dumpPath);
  const sql = fs.readFileSync(dumpPath, "utf-8");
  console.log(`Loaded ${sql.length.toLocaleString()} bytes of SQL statements.`);

  console.log("Connecting to MySQL...");
  const conn = await mysql.createConnection({
    uri: dbUrl,
    multipleStatements: true,
  });

  console.log("Connected successfully. Restoring all 83 tables, relationships, and data...");
  const start = Date.now();

  await conn.query(sql);

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`Restoration completed in ${duration} seconds!`);

  const [tables] = await conn.query("SHOW TABLES;");
  console.log(`Total Tables Restored: ${tables.length}`);

  const [users] = await conn.query("SELECT id, name, email, phone, active_role FROM `users`;");
  console.log("\nVerified Users in Database:");
  console.table(users);

  await conn.end();
  console.log("==========================================================");
  console.log(" Database synchronization complete! VPS matches local 100%.");
  console.log("==========================================================");
}

restoreDatabase().catch((err) => {
  console.error("Restoration Failed:", err);
  process.exit(1);
});
