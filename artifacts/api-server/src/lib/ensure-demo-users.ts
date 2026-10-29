import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export interface DemoUserDef {
  name: string;
  email: string;
  phone: string;
  roles: string[];
  activeRole: string;
  password?: string;
}

export const ESSENTIAL_DEMO_USERS: DemoUserDef[] = [
  {
    name: "Ananya Rao",
    email: "ananya.rao@kanak.in",
    phone: "9876543210",
    roles: [
      "admin",
      "project_manager",
      "engineer",
      "accountant",
      "procurement_officer",
      "viewer",
    ],
    activeRole: "admin",
    password: "password123",
  },
  {
    name: "Harinarayana",
    email: "Hari.mailapalli12@gmail.com",
    phone: "9876543211",
    roles: [
      "admin",
      "project_manager",
      "engineer",
      "accountant",
      "procurement_officer",
      "viewer",
    ],
    activeRole: "project_manager",
    password: "password123",
  },
  {
    name: "Rohan Mehta",
    email: "rohan.mehta@kanak.in",
    phone: "9876543212",
    roles: ["project_manager", "viewer"],
    activeRole: "project_manager",
    password: "password123",
  },
  {
    name: "Priya Iyer",
    email: "priya.iyer@kanak.in",
    phone: "9876543213",
    roles: ["engineer", "viewer"],
    activeRole: "engineer",
    password: "password123",
  },
  {
    name: "Vikram Shah",
    email: "vikram.shah@kanak.in",
    phone: "9876543214",
    roles: ["accountant", "viewer"],
    activeRole: "accountant",
    password: "password123",
  },
  {
    name: "Neha Kapoor",
    email: "neha.kapoor@kanak.in",
    phone: "9876543215",
    roles: ["procurement_officer", "viewer"],
    activeRole: "procurement_officer",
    password: "password123",
  },
  {
    name: "Arjun Singh",
    email: "arjun.singh@kanak.in",
    phone: "9876543216",
    roles: ["viewer"],
    activeRole: "viewer",
    password: "password123",
  },
  {
    name: "Baipalli Venkateswara Rao",
    email: "venkibaipalli@gmail.com",
    phone: "9876543217",
    roles: [
      "admin",
      "project_manager",
      "engineer",
      "accountant",
      "procurement_officer",
      "viewer",
    ],
    activeRole: "admin",
    password: "password123",
  },
];

export function isEssentialDemoAccount(identifier: string | null | undefined): boolean {
  if (!identifier) return false;
  const cleaned = identifier.toString().trim().toLowerCase();
  const digitsOnly = cleaned.replace(/[^0-9]/g, "");

  if (cleaned.endsWith("@kanak.in")) return true;
  if (cleaned === "hari.mailapalli12@gmail.com") return true;
  if (cleaned === "venkibaipalli@gmail.com") return true;

  if (digitsOnly.length >= 10) {
    const last10 = digitsOnly.slice(-10);
    return ESSENTIAL_DEMO_USERS.some((u) => u.phone === last10);
  }

  return ESSENTIAL_DEMO_USERS.some(
    (u) => u.email.toLowerCase() === cleaned
  );
}

/**
 * Bootstraps the Initial Super Admin in production, or synchronizes demo accounts in development.
 * In production:
 *   - Checks if any user exists in `users`.
 *   - If empty, provisions the primary Super Admin from environment variables.
 *   - If users exist, preserves all passwords, data, and user changes without overwriting.
 * In non-production (development):
 *   - Ensures demo accounts are synchronized with standard test credentials.
 */
export async function ensureEssentialDemoUsers(): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";

  try {
    if (isProd) {
      const [countRows]: any = await pool.query("SELECT COUNT(*) as cnt FROM `users`;");
      const count = countRows?.[0]?.cnt ?? 0;

      if (count > 0) {
        logger.info(
          { userCount: count },
          "Production database has active users. User data and passwords are preserved."
        );
        return;
      }

      // Bootstrap Initial Super Admin Account for Production
      const adminEmail = process.env.ADMIN_EMAIL || "Hari.mailapalli12@gmail.com";
      const adminPhone = process.env.ADMIN_PHONE || "9876543211";
      const adminName = process.env.ADMIN_NAME || "Harinarayana";
      const adminPass = process.env.ADMIN_PASSWORD || "AdminPass2026!";

      const adminHash = await bcrypt.hash(adminPass, 10);
      const adminRoles = JSON.stringify([
        "admin",
        "project_manager",
        "engineer",
        "accountant",
        "procurement_officer",
        "viewer",
      ]);

      await pool.query(
        "INSERT INTO `users` (" +
        "`organization_id`, `name`, `email`, `phone`, `password_hash`, `roles`, `active_role`, `two_factor_enabled`, `created_at`, `updated_at`" +
        ") VALUES (1, ?, ?, ?, ?, ?, 'admin', 0, NOW(), NOW());",
        [adminName, adminEmail, adminPhone, adminHash, adminRoles]
      );

      logger.info(
        { adminEmail, adminPhone },
        "Production Super Admin bootstrapped successfully."
      );
      return;
    }

    // Development / Staging: synchronize demo accounts
    const validHash = await bcrypt.hash("password123", 10);

    for (const demo of ESSENTIAL_DEMO_USERS) {
      const normalizedEmail = demo.email.toLowerCase();
      const rolesJson = JSON.stringify(demo.roles);

      const [existingRows]: any = await pool.query(
        "SELECT id, email, phone FROM `users` WHERE LOWER(`email`) = ? OR `phone` = ? LIMIT 1;",
        [normalizedEmail, demo.phone]
      );

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        const existing = existingRows[0];
        await pool.query(
          "UPDATE `users` SET " +
          "`name` = ?, " +
          "`email` = ?, " +
          "`phone` = ?, " +
          "`roles` = ?, " +
          "`active_role` = ?, " +
          "`password_hash` = ?, " +
          "`two_factor_enabled` = 0, " +
          "`updated_at` = NOW() " +
          "WHERE `id` = ?;",
          [
            demo.name,
            demo.email,
            demo.phone,
            rolesJson,
            demo.activeRole,
            validHash,
            existing.id,
          ]
        );
      } else {
        await pool.query(
          "INSERT INTO `users` (" +
          "`organization_id`, `name`, `email`, `phone`, `password_hash`, `roles`, `active_role`, `two_factor_enabled`, `created_at`, `updated_at`" +
          ") VALUES (1, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW());",
          [
            demo.name,
            demo.email,
            demo.phone,
            validHash,
            rolesJson,
            demo.activeRole,
          ]
        );
      }
    }

    logger.info(
      { count: ESSENTIAL_DEMO_USERS.length },
      "Development demo accounts verified and synchronized successfully."
    );
  } catch (err: any) {
    logger.error(
      { err: err.message },
      "Error during user initialization routine."
    );
  }
}
