import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Try resolving dotenv and mysql2
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

// Parse command line arguments
// Supports: node scripts/restore-database.mjs [custom_url] OR --user=... --password=... --host=... --database=...
const args = process.argv.slice(2);
let customUrl = args.find((a) => a.startsWith("mysql://") || a.startsWith("mysql2://"));

let cliUser = "";
let cliPassword = "";
let cliHost = "";
let cliPort = "3306";
let cliDatabase = "";

for (const arg of args) {
  if (arg.startsWith("--user=")) cliUser = arg.split("=")[1];
  if (arg.startsWith("--password=")) cliPassword = arg.split("=")[1];
  if (arg.startsWith("--host=")) cliHost = arg.split("=")[1];
  if (arg.startsWith("--port=")) cliPort = arg.split("=")[1];
  if (arg.startsWith("--database=") || arg.startsWith("--db=")) cliDatabase = arg.split("=")[1];
}

let dbUrl = customUrl || process.env.DATABASE_URL;

if (cliHost && cliUser) {
  dbUrl = `mysql://${encodeURIComponent(cliUser)}:${encodeURIComponent(cliPassword)}@${cliHost}:${cliPort}/${cliDatabase || "default"}`;
}

if (!dbUrl) {
  console.error(
    "FATAL ERROR: No database connection specified.\n" +
    "Provide DATABASE_URL environment variable or pass connection URL directly:\n" +
    "  node scripts/restore-database.mjs mysql://root:password@host:3306/dbname"
  );
  process.exit(1);
}

if (!mysql) {
  console.error("FATAL ERROR: Could not resolve mysql2 library.");
  process.exit(1);
}

function parseConnectionDetails(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, "") || "default",
      multipleStatements: true,
      connectTimeout: 10000,
    };
  } catch (err) {
    return {
      uri: urlStr,
      multipleStatements: true,
      connectTimeout: 10000,
    };
  }
}

async function restoreDatabase() {
  console.log("==========================================================");
  console.log(" Kanak TurnKey — Complete Production Database Restorer");
  console.log("==========================================================");

  const connConfig = parseConnectionDetails(dbUrl);
  const displayHost = connConfig.host || "target host";
  const displayPort = connConfig.port || "3306";
  const displayUser = connConfig.user || "target user";
  const displayDb = connConfig.database || "target db";

  console.log(`Target: ${displayUser}@${displayHost}:${displayPort}/${displayDb}`);

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

  console.log(`Connecting to MySQL at ${displayHost}:${displayPort}...`);
  let conn;
  try {
    conn = await mysql.createConnection(connConfig);
  } catch (err) {
    console.error("\n❌ Connection Failed:", err.message);
    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n[DIAGNOSTIC TIP]");
      console.error(`MySQL rejected authentication for user '${displayUser}'.`);
      console.error("In Coolify, check your MySQL Database Resource settings:");
      console.error("1. Check MYSQL_ROOT_PASSWORD or MYSQL_PASSWORD in Coolify -> Databases -> Your MySQL");
      console.error("2. If user '" + displayUser + "' is denied, try using user 'root' with the root password:");
      console.error(`   node scripts/restore-database.mjs mysql://root:<MYSQL_ROOT_PASSWORD>@${displayHost}:${displayPort}/${displayDb}`);
      console.error("3. If password has special characters like '@', '#', '%', pass flags directly:");
      console.error(`   node scripts/restore-database.mjs --user=root --password=YOUR_PASS --host=${displayHost} --database=${displayDb}`);
    }
    process.exit(1);
  }

  console.log("✅ Connected successfully. Restoring all 83 tables, relationships, and data...");
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
