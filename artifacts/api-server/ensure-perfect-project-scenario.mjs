import {
  db,
  projectsTable,
  tasksTable,
  budgetItemsTable,
  contractsTable,
  contractBoqItemsTable,
  workCompletionsTable,
  workCompletionItemsTable,
  workCompletionDocumentsTable,
  raBillsTable,
  raBillItemsTable,
  raBillDocumentsTable,
  raBillApprovalHistoryTable,
  invoicesTable,
  invoicePaymentsTable,
  paymentRemindersTable,
  procurementMaterialRequestsTable,
  procurementMaterialRequestItemsTable,
  procurementRfqsTable,
  procurementRfqItemsTable,
  procurementRfqVendorsTable,
  procurementVendorQuotesTable,
  procurementVendorQuoteItemsTable,
  procurementPurchaseOrdersTable,
  procurementPurchaseOrderItemsTable,
  procurementMaterialReceiptsTable,
  procurementMaterialReceiptItemsTable,
  procurementQualityInspectionsTable,
  procurementQualityInspectionItemsTable,
  procurementInventoryItemsTable,
  procurementInventoryTransactionsTable,
  vendorsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

async function main() {
  console.log("=== ENSURING PERFECT END-TO-END PROJECT SCENARIO ===");
  const projectId = 12;

  // 1. Get or verify user and vendor
  const [user] = await db.select().from(usersTable).limit(1);
  const userId = user?.id || 17;

  const [aaravVendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, 1));
  const [bhagwatiVendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, 6));

  // 2. Update Project 12 metadata
  console.log("\n[1] Verifying Project 12 metadata...");
  await db.update(projectsTable).set({
    name: "Sapphire Grand Hotel & Convention Center",
    clientName: "BlueWave Hospitality Pvt. Ltd",
    type: "Hospitality & Commercial Turnkey",
    location: "Plot 42, Aerocity Boulevard, Mumbai",
    budget: "85000000", // ₹8.5 Crores
    status: "execution",
    progress: 35,
    description: "5-Star Luxury Business Hotel featuring 120 keys, 800-pax convention banquet hall, multi-cuisine restaurants, and rooftop infinity deck.",
    startDate: "2026-09-01",
    endDate: "2027-08-31",
  }).where(eq(projectsTable.id, projectId));
  console.log("Project 12 updated!");

  // 3. Update / Add Budget Items
  console.log("\n[2] Setting up Project Budget items...");
  const budgetList = [
    { costCode: "CIVIL-002", description: "Substructure & RCC Civil Works", budgeted: "35000000", committed: "4009320", actual: "1209900" },
    { costCode: "ELEC-01", description: "Electrical HT/LT Substation & Cabling", budgeted: "15000000", committed: "0", actual: "0" },
    { costCode: "MAT-01", description: "Flooring, Italian Marble & Wall Cladding", budgeted: "12000000", committed: "0", actual: "0" },
    { costCode: "HVAC-01", description: "Central VRV/HVAC Air Conditioning Plant", budgeted: "13000000", committed: "0", actual: "0" },
    { costCode: "PLUMB-01", description: "Plumbing, Firefighting & Water Treatment", budgeted: "10000000", committed: "0", actual: "0" },
  ];

  for (const b of budgetList) {
    const [existing] = await db.select().from(budgetItemsTable).where(and(eq(budgetItemsTable.projectId, projectId), eq(budgetItemsTable.costCode, b.costCode)));
    if (existing) {
      await db.update(budgetItemsTable).set(b).where(eq(budgetItemsTable.id, existing.id));
    } else {
      await db.insert(budgetItemsTable).values({ projectId, ...b });
    }
  }
  console.log("Budget items synchronized!");

  // 4. Procurement: Ensure MR, RFQ, Quotes, PO, GRN, QC, Inventory
  console.log("\n[3] Setting up Procurement Chain...");
  // MR
  let [mr] = await db.select().from(procurementMaterialRequestsTable).where(eq(procurementMaterialRequestsTable.projectId, projectId)).limit(1);
  if (!mr) {
    await db.insert(procurementMaterialRequestsTable).values({
      requestNumber: "MR-20260923-0012",
      projectId,
      title: "Structural Grade Cement (OPC 53) & TMT Steel Fe500",
      description: "Immediate procurement for Foundation & Footings Phase 1 concrete casting.",
      category: "civil",
      priority: "high",
      requiredDate: "2026-09-25",
      status: "approved",
      requestedById: userId,
      approvedById: userId,
      approvalDate: new Date(),
      approvalComments: "Approved for footing concrete casting schedule.",
      estimatedCost: "984000",
    });
    [mr] = await db.select().from(procurementMaterialRequestsTable).where(eq(procurementMaterialRequestsTable.projectId, projectId)).limit(1);
  } else {
    await db.update(procurementMaterialRequestsTable).set({
      status: "approved",
      title: "Structural Grade Cement (OPC 53) & TMT Steel Fe500",
    }).where(eq(procurementMaterialRequestsTable.id, mr.id));
  }

  // MR Items
  await db.delete(procurementMaterialRequestItemsTable).where(eq(procurementMaterialRequestItemsTable.materialRequestId, mr.id));
  await db.insert(procurementMaterialRequestItemsTable).values([
    {
      materialRequestId: mr.id,
      itemName: "OPC 53 Grade Ultratech Cement",
      description: "50kg HDPE bags, fresh batch compliant with IS 12269",
      specification: "IS 12269 certified, 28-day strength >= 53 MPa",
      quantity: "400",
      unit: "bags",
      estimatedUnitPrice: "420",
      estimatedTotal: "168000",
      sortOrder: 0,
    },
    {
      materialRequestId: mr.id,
      itemName: "TMT Fe500D Reinforcement Steel 16mm",
      description: "High yield strength corrosion resistant thermo-mechanically treated rebar",
      specification: "IS 1786 certified, Fe500D ductile grade",
      quantity: "12",
      unit: "MT",
      estimatedUnitPrice: "68000",
      estimatedTotal: "816000",
      sortOrder: 1,
    }
  ]);
  console.log(`Material Request ${mr.requestNumber} configured!`);

  // RFQ
  let [rfq] = await db.select().from(procurementRfqsTable).where(eq(procurementRfqsTable.projectId, projectId)).limit(1);
  if (!rfq) {
    await db.insert(procurementRfqsTable).values({
      rfqNumber: "RFQ-20260923-0012",
      materialRequestId: mr.id,
      projectId,
      title: "RFQ - Structural Concrete & Rebar Package",
      description: "Competitive tender for cement & rebar foundation supply.",
      status: "evaluated",
      dueDate: "2026-09-24",
      createdById: userId,
      sentToVendorCount: 2,
      quotesReceivedCount: 2,
    });
    [rfq] = await db.select().from(procurementRfqsTable).where(eq(procurementRfqsTable.projectId, projectId)).limit(1);
  } else {
    await db.update(procurementRfqsTable).set({
      materialRequestId: mr.id,
      status: "evaluated",
      title: "RFQ - Structural Concrete & Rebar Package",
    }).where(eq(procurementRfqsTable.id, rfq.id));
  }

  // RFQ Items
  await db.delete(procurementRfqItemsTable).where(eq(procurementRfqItemsTable.rfqId, rfq.id));
  await db.insert(procurementRfqItemsTable).values([
    { rfqId: rfq.id, itemName: "OPC 53 Grade Ultratech Cement", quantity: "400", unit: "bags", sortOrder: 0 },
    { rfqId: rfq.id, itemName: "TMT Fe500D Reinforcement Steel 16mm", quantity: "12", unit: "MT", sortOrder: 1 }
  ]);

  // RFQ Vendors
  await db.delete(procurementRfqVendorsTable).where(eq(procurementRfqVendorsTable.rfqId, rfq.id));
  await db.insert(procurementRfqVendorsTable).values([
    { rfqId: rfq.id, vendorId: 1, status: "responded", sentDate: new Date(), respondedDate: new Date() },
    { rfqId: rfq.id, vendorId: 6, status: "responded", sentDate: new Date(), respondedDate: new Date() }
  ]);
  console.log(`RFQ ${rfq.rfqNumber} configured!`);

  // Vendor Quotes
  let [q1] = await db.select().from(procurementVendorQuotesTable).where(eq(procurementVendorQuotesTable.rfqId, rfq.id)).limit(1);
  if (!q1) {
    await db.insert(procurementVendorQuotesTable).values({
      quoteNumber: "QTE-20260923-0001",
      rfqId: rfq.id,
      vendorId: 1,
      quotedDate: "2026-09-21",
      deliveryDays: 3,
      deliveryTerms: "FOR Site Delivery (Freight Paid)",
      paymentTerms: "Net 30 Days after certified delivery",
      subtotal: "974000",
      taxPercent: "18",
      taxAmount: "175320",
      totalAmount: "1149320",
      isSelected: true,
      selectionReason: "L1 lowest qualified commercial bidder with fastest 3-day lead time.",
      selectedById: userId,
      selectedDate: new Date(),
      status: "selected",
    });
    [q1] = await db.select().from(procurementVendorQuotesTable).where(eq(procurementVendorQuotesTable.rfqId, rfq.id)).limit(1);
  } else {
    await db.update(procurementVendorQuotesTable).set({
      isSelected: true,
      status: "selected",
      subtotal: "974000",
      taxAmount: "175320",
      totalAmount: "1149320",
      selectionReason: "L1 lowest qualified commercial bidder with fastest 3-day lead time.",
    }).where(eq(procurementVendorQuotesTable.id, q1.id));
  }
  await db.update(procurementRfqsTable).set({ selectedQuoteId: q1.id }).where(eq(procurementRfqsTable.id, rfq.id));

  // Purchase Order
  let [po] = await db.select().from(procurementPurchaseOrdersTable).where(eq(procurementPurchaseOrdersTable.projectId, projectId)).limit(1);
  if (!po) {
    await db.insert(procurementPurchaseOrdersTable).values({
      poNumber: "PO-20260923-0012",
      rfqId: rfq.id,
      quoteId: q1.id,
      materialRequestId: mr.id,
      projectId,
      vendorId: 1,
      poDate: "2026-09-21",
      expectedDeliveryDate: "2026-09-24",
      subtotal: "974000",
      taxAmount: "175320",
      shippingCost: "0",
      totalAmount: "1149320",
      deliveryTerms: "Immediate delivery to Sapphire Grand Hotel Site Central Godown.",
      paymentTerms: "Net 30 Days",
      status: "issued",
      deliveryStatus: "delivered",
      createdById: userId,
      notes: "PO for Phase 1 Foundation Cement & Reinforcement Steel",
    });
    [po] = await db.select().from(procurementPurchaseOrdersTable).where(eq(procurementPurchaseOrdersTable.projectId, projectId)).limit(1);
  } else {
    await db.update(procurementPurchaseOrdersTable).set({
      rfqId: rfq.id,
      quoteId: q1.id,
      materialRequestId: mr.id,
      vendorId: 1,
      subtotal: "974000",
      taxAmount: "175320",
      totalAmount: "1149320",
      status: "issued",
      deliveryStatus: "delivered",
    }).where(eq(procurementPurchaseOrdersTable.id, po.id));
  }

  // PO Items
  await db.delete(procurementPurchaseOrderItemsTable).where(eq(procurementPurchaseOrderItemsTable.poId, po.id));
  await db.insert(procurementPurchaseOrderItemsTable).values([
    {
      poId: po.id,
      itemName: "OPC 53 Grade Ultratech Cement",
      description: "50kg HDPE bags",
      quantity: "400",
      unit: "bags",
      unitPrice: "410",
      totalPrice: "164000",
      receivedQuantity: "400",
      acceptedQuantity: "400",
      rejectedQuantity: "0",
      sortOrder: 0,
    },
    {
      poId: po.id,
      itemName: "TMT Fe500D Reinforcement Steel 16mm",
      description: "16mm Rebar IS 1786",
      quantity: "12",
      unit: "MT",
      unitPrice: "67500",
      totalPrice: "810000",
      receivedQuantity: "12",
      acceptedQuantity: "12",
      rejectedQuantity: "0",
      sortOrder: 1,
    }
  ]);
  console.log(`PO ${po.poNumber} configured!`);

  // Goods Receipt Note (GRN)
  let [grn] = await db.select().from(procurementMaterialReceiptsTable).where(eq(procurementMaterialReceiptsTable.poId, po.id)).limit(1);
  if (!grn) {
    await db.insert(procurementMaterialReceiptsTable).values({
      receiptNumber: "GRN-20260923-0012",
      poId: po.id,
      deliveryChallanNumber: "DC-BLW-9921",
      carrierName: "Om Logistics Freight Carriers",
      vehicleNumber: "MH-12-QE-4481",
      receivedDate: "2026-09-22",
      receivedById: userId,
      status: "inspected",
      notes: "Full consignment arrived intact at Project 12 site gate.",
    });
    [grn] = await db.select().from(procurementMaterialReceiptsTable).where(eq(procurementMaterialReceiptsTable.poId, po.id)).limit(1);
  } else {
    await db.update(procurementMaterialReceiptsTable).set({
      receiptNumber: "GRN-20260923-0012",
      deliveryChallanNumber: "DC-BLW-9921",
      carrierName: "Om Logistics Freight Carriers",
      vehicleNumber: "MH-12-QE-4481",
      status: "inspected",
    }).where(eq(procurementMaterialReceiptsTable.id, grn.id));
  }

  // GRN Items
  await db.delete(procurementMaterialReceiptItemsTable).where(eq(procurementMaterialReceiptItemsTable.receiptId, grn.id));
  await db.insert(procurementMaterialReceiptItemsTable).values([
    { receiptId: grn.id, itemName: "OPC 53 Grade Ultratech Cement", receivedQuantity: "400", unit: "bags" },
    { receiptId: grn.id, itemName: "TMT Fe500D Reinforcement Steel 16mm", receivedQuantity: "12", unit: "MT" }
  ]);
  console.log(`GRN ${grn.receiptNumber} configured!`);

  // Quality Inspection (QC)
  let [qc] = await db.select().from(procurementQualityInspectionsTable).where(eq(procurementQualityInspectionsTable.poId, po.id)).limit(1);
  if (!qc) {
    await db.insert(procurementQualityInspectionsTable).values({
      inspectionNumber: "QC-20260923-0012",
      poId: po.id,
      receiptId: grn.id,
      projectId,
      inspectionDate: "2026-09-22",
      inspectedById: userId,
      type: "Inward Raw Material Verification",
      result: "passed",
      remarks: "Slump test 120mm compliant with IS 456; rebar bend and yield tensile test compliant with IS 1786. Approved for footing casting.",
      status: "approved",
      approvedById: userId,
      approvedDate: new Date(),
    });
    [qc] = await db.select().from(procurementQualityInspectionsTable).where(eq(procurementQualityInspectionsTable.poId, po.id)).limit(1);
  } else {
    await db.update(procurementQualityInspectionsTable).set({
      inspectionNumber: "QC-20260923-0012",
      result: "passed",
      status: "approved",
      remarks: "Slump test 120mm compliant with IS 456; rebar bend and yield tensile test compliant with IS 1786. Approved for footing casting.",
    }).where(eq(procurementQualityInspectionsTable.id, qc.id));
  }

  // QC Items
  await db.delete(procurementQualityInspectionItemsTable).where(eq(procurementQualityInspectionItemsTable.inspectionId, qc.id));
  await db.insert(procurementQualityInspectionItemsTable).values([
    {
      inspectionId: qc.id,
      itemName: "OPC 53 Grade Ultratech Cement",
      inspectedQuantity: "400",
      acceptedQuantity: "400",
      rejectedQuantity: "0",
      unit: "bags",
      result: "passed",
      remarks: "Batch cert verified, 28-day target strength >= 53 MPa confirmed",
    },
    {
      inspectionId: qc.id,
      itemName: "TMT Fe500D Reinforcement Steel 16mm",
      inspectedQuantity: "12",
      acceptedQuantity: "12",
      rejectedQuantity: "0",
      unit: "MT",
      result: "passed",
      remarks: "Zero micro-cracks on 180° mandrel bend test, elongation 16.5%",
    }
  ]);
  console.log(`QC ${qc.inspectionNumber} configured!`);

  // Site Inventory
  const invItems = [
    { itemName: "OPC 53 Grade Ultratech Cement", category: "civil", unit: "bags", currentStock: "400", minimumStock: "50", reorderPoint: "100", unitPrice: "410", storageLocation: "Central Cement Godown A-1" },
    { itemName: "TMT Fe500D Reinforcement Steel 16mm", category: "steel", unit: "MT", currentStock: "12", minimumStock: "2", reorderPoint: "5", unitPrice: "67500", storageLocation: "Yard Rebar Fabrication Bay" }
  ];
  for (const inv of invItems) {
    const [existing] = await db.select().from(procurementInventoryItemsTable).where(and(eq(procurementInventoryItemsTable.projectId, projectId), eq(procurementInventoryItemsTable.itemName, inv.itemName)));
    if (!existing) {
      await db.insert(procurementInventoryItemsTable).values({ projectId, ...inv });
    } else {
      await db.update(procurementInventoryItemsTable).set(inv).where(eq(procurementInventoryItemsTable.id, existing.id));
    }
  }
  console.log("Site Inventory stocked!");

  // 5. Verify Subcontract & BOQ
  console.log("\n[4] Verifying Subcontract CNT-20260923-0001 & BOQ items...");
  let [contract] = await db.select().from(contractsTable).where(eq(contractsTable.projectId, projectId)).limit(1);
  if (!contract) {
    await db.insert(contractsTable).values({
      contractNumber: "CNT-20260923-0001",
      projectId,
      vendorId: 1,
      title: "RCC Structural & Masonry Contract",
      description: "Complete concrete and brickwork scope for Phase 1 Foundation & Podium.",
      totalAmount: "2860000",
      retentionPercent: "5",
      advancePercent: "0",
      tdsPercent: "2",
      gstPercent: "18",
      startDate: "2026-09-01",
      endDate: "2026-12-31",
      status: "active",
      createdById: userId,
    });
    [contract] = await db.select().from(contractsTable).where(eq(contractsTable.projectId, projectId)).limit(1);
  }

  // Ensure Contract BOQ items
  const boqList = [
    { itemNumber: "1.1", description: "M25 Grade Ready Mix Concrete in Footings & Raft", unit: "cum", quantity: "200", rate: "5500", totalAmount: "1100000", previousQuantity: "0", currentQuantity: "100", cumulativeQuantity: "100" },
    { itemNumber: "1.2", description: "High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500", unit: "kg", quantity: "15000", rate: "72", totalAmount: "1080000", previousQuantity: "0", currentQuantity: "7500", cumulativeQuantity: "7500" },
    { itemNumber: "1.3", description: "200mm Solid Concrete Block Masonry in Substructure Walls", unit: "sqm", quantity: "800", rate: "850", totalAmount: "680000", previousQuantity: "0", currentQuantity: "0", cumulativeQuantity: "0" },
  ];
  await db.delete(contractBoqItemsTable).where(eq(contractBoqItemsTable.contractId, contract.id));
  for (const b of boqList) {
    await db.insert(contractBoqItemsTable).values({ contractId: contract.id, ...b });
  }
  const contractBoqs = await db.select().from(contractBoqItemsTable).where(eq(contractBoqItemsTable.contractId, contract.id));
  console.log(`Contract ${contract.contractNumber} configured with ${contractBoqs.length} BOQ items!`);

  // 6. Work Completion & Documents
  console.log("\n[5] Verifying Work Completion & JMR...");
  let [wc] = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.contractId, contract.id)).limit(1);
  if (!wc) {
    await db.insert(workCompletionsTable).values({
      workCompletionNumber: "WC-20260923-0001",
      projectId,
      contractId: contract.id,
      vendorId: 1,
      title: "Footings & Foundation Work Completion",
      milestone: "Milestone 1 - Foundation & Raft",
      completionDate: "2026-09-20",
      remarks: "100 cum M25 concrete poured and 7.5 MT rebar tied. Cube strength test passed with 28.4 MPa.",
      status: "verified",
      submittedAt: new Date("2026-09-20T10:00:00Z"),
      verifiedById: userId,
      verifiedAt: new Date("2026-09-21T14:30:00Z"),
      createdById: userId,
    });
    [wc] = await db.select().from(workCompletionsTable).where(eq(workCompletionsTable.contractId, contract.id)).limit(1);
  } else {
    await db.update(workCompletionsTable).set({
      status: "verified",
      milestone: "Milestone 1 - Foundation & Raft",
      verifiedById: userId,
      verifiedAt: new Date("2026-09-21T14:30:00Z"),
    }).where(eq(workCompletionsTable.id, wc.id));
  }

  // Work Completion Items
  await db.delete(workCompletionItemsTable).where(eq(workCompletionItemsTable.workCompletionId, wc.id));
  await db.insert(workCompletionItemsTable).values([
    {
      workCompletionId: wc.id,
      contractBoqItemId: contractBoqs[0].id,
      completedQuantity: "100",
      rate: "5500",
      totalAmount: "550000",
      locationOrGrid: "Grid A1-D4 Footings",
      remarks: "Poured using boom pump with 100% vibrator compaction",
    },
    {
      workCompletionId: wc.id,
      contractBoqItemId: contractBoqs[1].id,
      completedQuantity: "7500",
      rate: "72",
      totalAmount: "540000",
      locationOrGrid: "Grid A1-D4 Rebar Cage",
      remarks: "Checked bar spacing 150mm c/c with cover blocks certified",
    }
  ]);

  // Work Completion Documents (JMR and Photos)
  await db.delete(workCompletionDocumentsTable).where(eq(workCompletionDocumentsTable.workCompletionId, wc.id));
  await db.insert(workCompletionDocumentsTable).values([
    {
      workCompletionId: wc.id,
      title: "Joint Measurement Sheet (JMR #01 - Footings)",
      documentType: "jmr",
      documentUrl: "https://documents.kanakturnkey.com/jmr/JMR-20260920-Footing.pdf",
      fileName: "JMR-20260920-Footing.pdf",
      uploadedById: userId,
    },
    {
      workCompletionId: wc.id,
      title: "28-Day Concrete Cube Strength Test Certificate",
      documentType: "test_report",
      documentUrl: "https://documents.kanakturnkey.com/reports/CubeTest-IS456-Batch44.pdf",
      fileName: "CubeTest-IS456-Batch44.pdf",
      uploadedById: userId,
    },
    {
      workCompletionId: wc.id,
      title: "Site Geo-tagged Foundation Pour Inspection Photo",
      documentType: "photo",
      documentUrl: "https://documents.kanakturnkey.com/photos/Site-Footing-Pour-Geo.jpg",
      fileName: "Site-Footing-Pour-Geo.jpg",
      uploadedById: userId,
    }
  ]);
  console.log(`Work Completion ${wc.workCompletionNumber} configured with JMR and attachments!`);

  // 7. RA Bill
  console.log("\n[6] Verifying RA Bill & Financial Deductions...");
  let [raBill] = await db.select().from(raBillsTable).where(eq(raBillsTable.id, 9)).limit(1);
  if (!raBill) {
    [raBill] = await db.select().from(raBillsTable).where(eq(raBillsTable.projectId, projectId)).limit(1);
  }

  const raBillData = {
    projectId,
    contractId: contract.id,
    vendorId: 1,
    workCompletionId: wc.id,
    billNumber: "RA-20260923-0006",
    description: "1st Running Account Bill - Foundations & Plinth Pouring (Milestone 1)",
    milestone: "1st RA Bill - Foundation",
    billingPeriodStart: "2026-09-01",
    billingPeriodEnd: "2026-09-20",
    grossAmount: "1090000",
    retentionPercent: "5.00",
    retentionAmount: "54500",
    advanceRecovery: "0",
    tdsPercent: "2.00",
    tdsAmount: "21800",
    gstPercent: "18.00",
    gstAmount: "196200",
    otherDeductions: "0",
    netPayableAmount: "1209900",
    amount: "1209900",
    status: "invoice_generated",
    submittedAt: new Date("2026-09-21T16:00:00Z"),
    submittedById: userId,
    approvedById: userId,
    approvedAt: new Date("2026-09-22T11:00:00Z"),
    approvalComments: "Certified for payment. Quality and cube strength verified against IS 456.",
  };

  if (!raBill) {
    await db.insert(raBillsTable).values(raBillData);
    [raBill] = await db.select().from(raBillsTable).where(eq(raBillsTable.billNumber, "RA-20260923-0006")).limit(1);
  } else {
    await db.update(raBillsTable).set(raBillData).where(eq(raBillsTable.id, raBill.id));
  }

  // RA Bill items
  await db.delete(raBillItemsTable).where(eq(raBillItemsTable.raBillId, raBill.id));
  await db.insert(raBillItemsTable).values([
    {
      raBillId: raBill.id,
      contractBoqItemId: contractBoqs[0].id,
      itemNumber: "1.1",
      description: "M25 Grade Ready Mix Concrete in Footings & Raft",
      unit: "cum",
      totalBoqQuantity: "200",
      previousQuantity: "0",
      currentQuantity: "100",
      cumulativeQuantity: "100",
      rate: "5500",
      amount: "550000",
    },
    {
      raBillId: raBill.id,
      contractBoqItemId: contractBoqs[1].id,
      itemNumber: "1.2",
      description: "High Yield Strength Deformed (HYSD) Steel Reinforcement Fe500",
      unit: "kg",
      totalBoqQuantity: "15000",
      previousQuantity: "0",
      currentQuantity: "7500",
      cumulativeQuantity: "7500",
      rate: "72",
      amount: "540000",
    }
  ]);

  // RA Bill Approval History
  await db.delete(raBillApprovalHistoryTable).where(eq(raBillApprovalHistoryTable.raBillId, raBill.id));
  await db.insert(raBillApprovalHistoryTable).values([
    {
      raBillId: raBill.id,
      action: "submitted",
      actionById: userId,
      comments: "Prepared by QS and submitted for PM review along with JMR sheet.",
      actionDate: new Date("2026-09-21T16:00:00Z"),
    },
    {
      raBillId: raBill.id,
      action: "approved",
      actionById: userId,
      comments: "Certified for payment. Quality and cube strength verified against IS 456.",
      actionDate: new Date("2026-09-22T11:00:00Z"),
    }
  ]);
  console.log(`RA Bill ${raBill.billNumber} configured with audit trail!`);

  // 8. Tax Invoice, Payments, Reminders, Reconciliation
  console.log("\n[7] Verifying Client Tax Invoice, Payment & Accounting Settlement...");
  let [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.raBillId, raBill.id)).limit(1);
  if (!invoice) {
    [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, 10)).limit(1);
  }

  const invoiceData = {
    projectId,
    raBillId: raBill.id,
    vendorId: 1,
    contractId: contract.id,
    invoiceNumber: "INV-20260923-0007",
    clientName: "BlueWave Hospitality Pvt. Ltd",
    amount: "1209900",
    grossAmount: "1090000",
    deductions: "76300",
    taxAmount: "196200",
    netAmount: "1209900",
    invoiceDate: "2026-09-22",
    dueDate: "2026-10-22",
    paymentDate: "2026-09-23",
    paymentTerms: "Net 30 Days",
    sentAt: new Date("2026-09-22T14:00:00Z"),
    sentById: userId,
    recipientEmail: "accounts@bluewavehospitality.com",
    recipientNotes: "Please release payment against 1st certified RA bill for Foundation milestone.",
    totalPaidAmount: "1209900",
    outstandingAmount: "0",
    reconciliationStatus: "reconciled",
    reconciled: true,
    reconciledById: userId,
    reconciledAt: new Date("2026-09-23T11:30:00Z"),
    reconciliationRemarks: "Bank statement verified. Matched with HDFC Current Account #... in Tally ERP.",
    status: "closed",
  };

  if (!invoice) {
    await db.insert(invoicesTable).values(invoiceData);
    [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.invoiceNumber, "INV-20260923-0007")).limit(1);
  } else {
    await db.update(invoicesTable).set(invoiceData).where(eq(invoicesTable.id, invoice.id));
  }

  // Invoice Payment
  await db.delete(invoicePaymentsTable).where(eq(invoicePaymentsTable.invoiceId, invoice.id));
  await db.insert(invoicePaymentsTable).values({
    invoiceId: invoice.id,
    amount: "1209900",
    paymentDate: "2026-09-23",
    paymentMethod: "neft",
    referenceNumber: "UTR-HDFC-20260923-883921",
    bankName: "HDFC Bank Ltd",
    recordedById: userId,
    notes: "Full payment received for 1st RA bill milestone via RTGS/NEFT.",
  });

  // Payment Reminder
  await db.delete(paymentRemindersTable).where(eq(paymentRemindersTable.invoiceId, invoice.id));
  await db.insert(paymentRemindersTable).values({
    invoiceId: invoice.id,
    reminderType: "email",
    sentTo: "accounts@bluewavehospitality.com",
    sentById: userId,
    subject: "Payment Reminder: Milestone 1 RA Bill Invoice INV-20260923-0007",
    messageBody: "Dear Client, Please note Invoice INV-20260923-0007 for ₹12,09,900 is due. Attached is the certified RA bill abstract.",
    status: "delivered",
  });
  console.log(`Invoice ${invoice.invoiceNumber} configured with payments, reminders, and reconciliation!`);

  console.log("\n=======================================================");
  console.log("SUCCESS: 100% COMPLETE END-TO-END DATA READY FOR PROJECT 12!");
  console.log("=======================================================");
}

main().catch(err => {
  console.error("Error running script:", err);
  process.exit(1);
}).then(() => process.exit(0));
