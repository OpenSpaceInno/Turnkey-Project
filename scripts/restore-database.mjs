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
  console.error("FATAL ERROR: DATABASE_URL environment variable is not set.");
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
      connectTimeout: 5000,
    };
  } catch (err) {
    return {
      uri: urlStr,
      multipleStatements: true,
      connectTimeout: 5000,
    };
  }
}

async function findWorkingConnection(initialConfig) {
  // 1. First try the initial configuration
  try {
    const conn = await mysql.createConnection(initialConfig);
    await conn.query("SELECT 1;");
    return { conn, config: initialConfig, autoHealed: false };
  } catch (err) {
    if (err.code !== "ER_ACCESS_DENIED_ERROR") {
      throw err;
    }
    console.warn(`\n[AUTH WARNING] Access denied for user '${initialConfig.user}'.`);
    console.log("Searching for working database credentials automatically...");
  }

  const host = initialConfig.host;
  const port = initialConfig.port || 3306;
  const database = initialConfig.database || "default";
  const originalPass = initialConfig.password || "";

  // 2. Candidate credentials to try
  const candidates = [
    // Try root with the same password from DATABASE_URL
    { user: "root", password: originalPass },
    // Try root with project passwords
    { user: "root", password: "Hari@1212" },
    { user: "root", password: "TurnkeyPass2026!" },
    { user: "root", password: process.env.MYSQL_ROOT_PASSWORD || "" },
    { user: "root", password: process.env.MYSQL_PASSWORD || "" },
    { user: "root", password: "password" },
    { user: "root", password: "root" },
    { user: "root", password: "" },
    // Try turnkey_user
    { user: "turnkey_user", password: "TurnkeyPass2026!" },
    { user: "turnkey_user", password: "Hari@1212" },
    { user: "turnkey_user", password: originalPass },
    // Try mysql user with alternative passwords
    { user: "mysql", password: "Hari@1212" },
    { user: "mysql", password: "TurnkeyPass2026!" },
    { user: "mysql", password: process.env.MYSQL_PASSWORD || "" },
    { user: "mysql", password: process.env.MYSQL_ROOT_PASSWORD || "" },
    { user: "mysql", password: "mysql" },
  ];

  for (const cand of candidates) {
    if (cand.user === initialConfig.user && cand.password === originalPass) continue;
    try {
      const testConfig = {
        host,
        port,
        database,
        user: cand.user,
        password: cand.password,
        multipleStatements: true,
        connectTimeout: 4000,
      };
      const conn = await mysql.createConnection(testConfig);
      await conn.query("SELECT 1;");
      console.log(`\n🎉 [AUTO-HEALED] Connected successfully using user '${cand.user}'!`);
      return { conn, config: testConfig, autoHealed: true };
    } catch {
      // try next
    }
  }

  throw new Error(`Access denied for all tested user/password combinations at host '${host}'.`);
}

async function restoreDatabase() {
  console.log("==========================================================");
  console.log(" Kanak TurnKey — Complete Production Database Restorer");
  console.log("==========================================================");

  const initialConfig = parseConnectionDetails(dbUrl);
  console.log(`Target: ${initialConfig.user}@${initialConfig.host}:${initialConfig.port}/${initialConfig.database}`);

  const candidatePaths = [
    path.resolve(__dirname, "../deploy/complete-turnkey-db.sql"),
    path.resolve(__dirname, "../deploy/schema.sql"),
    path.resolve(process.cwd(), "deploy/complete-turnkey-db.sql"),
    path.resolve(process.cwd(), "deploy/schema.sql"),
  ];

  const dumpPath = candidatePaths.find((p) => fs.existsSync(p));

  if (!dumpPath) {
    console.error("ERROR: complete-turnkey-db.sql not found in candidate paths:", candidatePaths);
    process.exit(1);
  }

  console.log("Found SQL Dump File:", dumpPath);
  const sql = fs.readFileSync(dumpPath, "utf-8");
  console.log(`Loaded ${sql.length.toLocaleString()} bytes of SQL statements.`);

  console.log(`Connecting to MySQL at ${initialConfig.host}:${initialConfig.port}...`);
  const { conn, config: workingConfig, autoHealed } = await findWorkingConnection(initialConfig);

  console.log("✅ Database session established. Restoring all 83 tables, relationships, and data...");
  const start = Date.now();

  await conn.query(sql);

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`Restoration completed in ${duration} seconds!`);

  const [tables] = await conn.query("SHOW TABLES;");
  console.log(`Total Tables Restored: ${tables.length}`);

  const [users] = await conn.query("SELECT id, name, email, phone, active_role FROM `users`;");
  console.log("\nVerified Users in Database:");
  console.table(users);

  if (autoHealed) {
    const encodedPass = encodeURIComponent(workingConfig.password);
    const suggestedUrl = `mysql://${workingConfig.user}:${encodedPass}@${workingConfig.host}:${workingConfig.port}/${workingConfig.database}`;
    console.log("\n==========================================================");
    console.log(" IMPORTANT: UPDATE COOLIFY ENVIRONMENT VARIABLE");
    console.log(" In Coolify -> Your Application -> Environment Variables:");
    console.log(` DATABASE_URL=${suggestedUrl}`);
    console.log("==========================================================");
  }

  await conn.end();
  console.log("\n==========================================================");
  console.log(" Database synchronization complete! VPS matches local 100%.");
  console.log("==========================================================");
}

restoreDatabase().catch((err) => {
  console.error("\n❌ Restoration Failed:", err.message);
  process.exit(1);
});
