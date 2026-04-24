import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { PgTable } from "drizzle-orm/pg-core";

const ymd = (): string => {
  const t = new Date();
  return `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, "0")}${String(t.getDate()).padStart(2, "0")}`;
};

export const generateNumber = async (
  prefix: string,
  table: PgTable,
): Promise<string> => {
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(table);
  const seq = String((c ?? 0) + 1).padStart(4, "0");
  return `${prefix}-${ymd()}-${seq}`;
};
