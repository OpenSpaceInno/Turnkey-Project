import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./seed";
import { startCronScheduler } from "./lib/cron-scheduler";

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception in process");
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Rejection in process");
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  try {
    await seedIfEmpty();
    startCronScheduler();
  } catch (err) {
    logger.error({ err }, "Seed failed");
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
