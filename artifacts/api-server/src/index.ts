import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./seed";
import { startCronScheduler } from "./lib/cron-scheduler";
import { initDatabaseSchema } from "./lib/init-db";

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception in process");
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Rejection in process");
});

const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  try {
    await initDatabaseSchema();
    await seedIfEmpty();
    startCronScheduler();
  } catch (err) {
    logger.error({ err }, "Database startup / seed failed");
  }
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

main();
