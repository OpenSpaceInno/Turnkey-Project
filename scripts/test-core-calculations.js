// ==============================================================================
// Kanak TurnKey — Core Financial & Engineering Calculations Test Suite
// Sprint S1-H: Unit & Integration Verification
// ==============================================================================

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ PASSED: ${message}`);
  }
}

console.log("==================================================================");
console.log(" Running Core Calculations & Financial Verification Suite");
console.log("==================================================================");

// ─── 1. BOQ Item Price & Margin Recomputation ────────────────────────────────
console.log("\n[Test 1] BOQ Total & Margin Computation");
function computeBoqItem(quantity, unitRate, marginPercent, taxPercent) {
  const basePrice = quantity * unitRate;
  const marginAmount = (basePrice * marginPercent) / 100;
  const subtotalWithMargin = basePrice + marginAmount;
  const taxAmount = (subtotalWithMargin * taxPercent) / 100;
  const totalPrice = subtotalWithMargin + taxAmount;
  return {
    basePrice: Math.round(basePrice * 100) / 100,
    marginAmount: Math.round(marginAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}

const boqItem = computeBoqItem(150, 4200, 15, 18); // 150 MT steel @ 4200, 15% margin, 18% GST
assert(boqItem.basePrice === 630000, "Base price = 150 * 4200 = 630,000");
assert(boqItem.marginAmount === 94500, "15% Margin = 94,500");
assert(boqItem.taxAmount === 130410, "18% GST = 130,410");
assert(boqItem.totalPrice === 854910, "Total Price = 854,910");

// ─── 2. RA Bill Net Payable Calculation ──────────────────────────────────────
console.log("\n[Test 2] RA Bill Statutory & Contractual Deductions");
function computeRaBillNetPayable(gross, retentionPercent, advanceRecovery, tdsPercent, gstPercent) {
  const retention = (gross * retentionPercent) / 100;
  const tds = (gross * tdsPercent) / 100;
  const gst = (gross * gstPercent) / 100;
  const netPayable = gross - retention - advanceRecovery - tds + gst;
  return {
    gross,
    retention,
    advanceRecovery,
    tds,
    gst,
    netPayable: Math.round(netPayable * 100) / 100,
  };
}

const raBill = computeRaBillNetPayable(1090000, 5, 0, 2, 18);
assert(raBill.gross === 1090000, "Gross amount is 1,090,000");
assert(raBill.retention === 54500, "5% Retention is 54,500");
assert(raBill.tds === 21800, "2% TDS is 21,800");
assert(raBill.gst === 196200, "18% GST is 196,200");
assert(raBill.netPayable === 1209900, "Net payable = 1,090,000 - 54,500 - 21,800 + 196,200 = 1,209,900");

// ─── 3. 3-Way Match Verification (PO vs GRN vs Invoice) ───────────────────────
console.log("\n[Test 3] 3-Way Match Tolerance & Variance");
function verify3WayMatch(poQty, poRate, grnAcceptedQty, invoiceBilledQty, invoiceBilledRate, tolerancePercent = 2.0) {
  const poAmount = poQty * poRate;
  const invAmount = invoiceBilledQty * invoiceBilledRate;
  const variancePercent = Math.abs((invAmount - poAmount) / poAmount) * 100;

  const qtyMatch = invoiceBilledQty <= grnAcceptedQty;
  const rateMatch = invoiceBilledRate <= poRate;
  const withinTolerance = variancePercent <= tolerancePercent;

  let status = "matched";
  if (!qtyMatch) status = "qty_discrepancy";
  else if (!rateMatch && !withinTolerance) status = "price_discrepancy";

  return {
    poAmount,
    invAmount,
    variancePercent: Math.round(variancePercent * 100) / 100,
    status,
    pass: status === "matched",
  };
}

const matchValid = verify3WayMatch(100, 450, 100, 100, 450);
assert(matchValid.pass === true, "Exact match passes 3-way check");

const matchDiscrepancy = verify3WayMatch(100, 450, 90, 100, 480);
assert(matchDiscrepancy.pass === false && matchDiscrepancy.status === "qty_discrepancy", "Overbilled quantity correctly flagged as discrepancy");

// ─── 4. TDS Computation (Section 194C / 194J) ────────────────────────────────
console.log("\n[Test 4] TDS Auto-computation");
function computeTds(gross, category) {
  let rate = 2.0;
  if (category === "contractor_individual") rate = 1.0;
  if (category === "professional") rate = 10.0;
  const tds = (gross * rate) / 100;
  return { rate, tds, net: gross - tds };
}

const tdsCompany = computeTds(500000, "contractor_company");
assert(tdsCompany.rate === 2.0 && tdsCompany.tds === 10000, "Company civil contractor TDS is 2% (₹10,000)");

const tdsIndiv = computeTds(500000, "contractor_individual");
assert(tdsIndiv.rate === 1.0 && tdsIndiv.tds === 5000, "Individual subcontractor TDS is 1% (₹5,000)");

console.log("\n==================================================================");
if (process.exitCode === 1) {
  console.error(" ❌ Some tests failed. Please review output above.");
} else {
  console.log(" 🎉 All Core Calculations & Tests Passed Successfully!");
}
console.log("==================================================================");
