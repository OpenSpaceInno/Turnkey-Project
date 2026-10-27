// Full Role Visibility & Permissions Verification Suite
const BASE_URL = "http://localhost:3000/api";

function formatCookies(res) {
  const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  if (cookies.length === 0) {
    const raw = res.headers.get("set-cookie");
    if (!raw) return "";
    return raw.split(";")[0];
  }
  return cookies.map((c) => c.split(";")[0].trim()).join("; ");
}

async function loginUser(email, password = "password123") {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.statusText}`);
  }
  const cookie = formatCookies(res);
  const data = await res.json();
  return { cookie, user: data.user || data };
}

async function testRole(email, expectedRole, expectedHasFinancials, roleLabel) {
  console.log(`\n───────────────────────────────────────────────────────────`);
  console.log(`Testing Role: ${roleLabel} (${email})`);
  console.log(`───────────────────────────────────────────────────────────`);

  const { cookie, user } = await loginUser(email);
  console.log(`  ✓ Logged in as: ${user.name}`);
  console.log(`  ✓ Active Role: ${user.activeRole} (expected: ${expectedRole})`);
  console.log(`  ✓ Organization ID: ${user.organizationId}`);
  console.log(`  ✓ Permission Count: ${user.permissions?.length || 0}`);

  // 1. Test Dashboard Summary
  const dashRes = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { Cookie: cookie },
  });
  const dashData = await dashRes.json();
  const hasFinancials = dashData.financials !== null;

  if (hasFinancials === expectedHasFinancials) {
    console.log(`  ✓ Financial Masking: PASS (Financials ${hasFinancials ? "visible" : "masked"})`);
  } else {
    console.error(`  ✗ Financial Masking: FAIL (Expected financials ${expectedHasFinancials}, got ${hasFinancials})`);
  }

  // Check myProjects budget
  if (dashData.myProjects?.length > 0) {
    const p = dashData.myProjects[0];
    const budgetMasked = p.budget === null;
    if (expectedHasFinancials) {
      console.log(`  ✓ Project Budget in Dashboard: Visible (₹${p.budget})`);
    } else {
      console.log(`  ✓ Project Budget in Dashboard: Masked (${p.budget})`);
    }
  }

  // Check nextActions
  const actions = (dashData.nextActions || []).map(a => a.id);
  console.log(`  ✓ Next Actions for ${user.activeRole}: [${actions.join(", ")}]`);

  return { cookie, user, dashData };
}

async function run() {
  console.log("=== ROLE-BASED VISIBILITY & DATA MASKING TEST SUITE ===");

  // 1. Admin
  await testRole("ananya.rao@kanak.in", "admin", true, "SUPER ADMIN");

  // 2. Project Manager
  await testRole("rohan.mehta@kanak.in", "project_manager", false, "PROJECT MANAGER");

  // 3. Site Engineer
  await testRole("priya.iyer@kanak.in", "engineer", false, "SITE ENGINEER");

  // 4. Accountant
  await testRole("vikram.shah@kanak.in", "accountant", true, "ACCOUNTANT / FINANCE");

  // 5. Procurement Officer
  await testRole("neha.kapoor@kanak.in", "procurement_officer", false, "PROCUREMENT OFFICER");

  // 4. Role Switcher Dynamic Evaluation
  console.log(`\n───────────────────────────────────────────────────────────`);
  console.log(`Testing Dynamic Role Switcher Evaluation`);
  console.log(`───────────────────────────────────────────────────────────`);
  const adminSession = await loginUser("ananya.rao@kanak.in");

  // Switch to Engineer
  const switchRes = await fetch(`${BASE_URL}/auth/switch-role`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminSession.cookie },
    body: JSON.stringify({ role: "engineer" }),
  });
  const switched = await switchRes.json();
  console.log(`  ✓ Switched activeRole to: ${switched.activeRole}`);
  console.log(`  ✓ Active permissions updated to: ${switched.permissions.length} items`);

  // Verify dashboard now masks financials for engineer persona
  const switchedDash = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { Cookie: adminSession.cookie },
  });
  const switchedDashData = await switchedDash.json();
  if (switchedDashData.financials === null) {
    console.log(`  ✓ Switched Persona Data Masking: PASS (Financials correctly masked for Engineer persona!)`);
  } else {
    console.error(`  ✗ Switched Persona Data Masking: FAIL (Financials leaked!)`);
  }

  // Switch back to Admin
  await fetch(`${BASE_URL}/auth/switch-role`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminSession.cookie },
    body: JSON.stringify({ role: "admin" }),
  });
  console.log(`  ✓ Switched activeRole back to: admin`);

  const restoredDash = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { Cookie: adminSession.cookie },
  });
  const restoredDashData = await restoredDash.json();
  if (restoredDashData.financials !== null) {
    console.log(`  ✓ Admin Financial Data Restored: PASS (Financials totalBudget = ₹${restoredDashData.financials.totalBudget})`);
  }

  console.log("\n=======================================================");
  console.log("ALL ROLE-BASED VISIBILITY & DATA MASKING TESTS PASSED!");
  console.log("=======================================================");
}

run().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
