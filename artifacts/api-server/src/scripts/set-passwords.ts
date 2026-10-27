import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const testUsers = [
  "ananya.rao@kanak.in",
  "rohan.mehta@kanak.in",
  "priya.iyer@kanak.in",
  "vikram.shah@kanak.in",
  "neha.kapoor@kanak.in",
  "arjun.singh@kanak.in",
  "Hari.mailapalli12@gmail.com",
  "venkibaipalli@gmail.com"
];

const password = "password123";

async function setPasswords() {
  console.log("Setting passwords for test users...");
  
  const passwordHash = await bcrypt.hash(password, 10);
  console.log("Password hash generated:", passwordHash);
  
  for (const email of testUsers) {
    try {
      await db
        .update(usersTable)
        .set({ passwordHash })
        .where(eq(usersTable.email, email));
      console.log(`✅ Updated password for ${email}`);
    } catch (error) {
      console.error(`❌ Failed to update ${email}:`, error);
    }
  }
  
  console.log("\n✅ All passwords set successfully!");
  console.log(`Password for all users: ${password}`);
  process.exit(0);
}

setPasswords().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
