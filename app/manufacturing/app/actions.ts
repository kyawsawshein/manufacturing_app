"use server";

import { sqlQuery, createRecord, createRecords, updateRecord, deleteRecord, safeParseJson } from "@/lib/teable";

const BASE_ID = process.env.BASE_ID || "bsevp7nvwmXvxF5HKx4";

// BOM
const BOM_TABLE = process.env.BOM_TABLE || "tbl9MQqRZ4rP2k7BRQV";
const BOM_LINES_TABLE = process.env.BOM_LINES_TABLE || "tblGvS4JyTguqpE09WJ";

// Cutting
const CUTTING_TABLE = process.env.CUTTING_TABLE || "tblQVVdcMKf2tTRhK28"; // Assuming this is the Cutting table ID
const CUTTING_LINES_TABLE = process.env.CUTTING_LINES_TABLE || "tbln4EMtGtCBQvfkbnx"; // Assuming this is the Cutting Lines table ID
const CUTTING_REQUEST_TABLE = process.env.CUTTING_REQUEST_TABLE || "tblumYrf9COTAlowNGi"; // Assuming this is the Cutting Requirements table ID
const CUTTING_TUB_LINES_TABLE = process.env.CUTTING_TUB_LINES_TABLE || "tblowvr0CzcOuPPQznN"; // Assuming this is the Cutting Tub Lines table ID
const CUTTING_HOOK_LOOP_LINES_TABLE = process.env.CUTTING_HOOK_LOOP_LINES_TABLE || "tblZPTs4bpwoTIIgsr2"; // Assuming this is the Cutting Hook & Loop Lines table ID

// Request RM
const REQUEST_RM_TABLE = process.env.REQUEST_RM_TABLE || "tblftYFyyC63qvthl2p";
const REQUEST_ITEM_TABLE = process.env.REQUEST_ITEM_TABLE || "tbl8WnTtBbc61CzUZku";

// MO Raw Material
const MO_RAW_MATERIAL_TABLE = process.env.MO_RAW_MATERIAL_TABLE || "tbll7EAk5zrchcesx3s";

// MO
const MO_TABLE = process.env.MO_TABLE || "tbl0bvedWXqda86st39";


export interface Product {
  id: string;
  Name: string;
  productCode: string;
  cost: number | null;
  defaultBomId: string | null;
  defaultBomName: string | null;
}

export interface BOM {
  id: string;
  Name: string;
  reference: string | null;
  productId: string | null;
  productName: string | null;
  totalMaterialCost: number | null;
  quantity: number | null;
  status: string | null;
}

export interface BOMLine {
  id: string;
  productId: string | null;
  productName: string | null;
  quantity: number | null;
  unitCost: number | null;
  totalCost: number | null;
}

export interface Cutting {
  id: string;
  Name: string;
  reference: string | null;
  status: string | null;
}

export interface CuttingLine {
  id: string;
  productId: string | null;
  productName: string | null;
  quantity: number | null;
  unitCost: number | null;
  totalCost: number | null;
}

export interface CostPreview {
  rawMaterialsCost: number;
  laborCost: number;
  machineCost: number;
  overheadCost: number;
  totalCost: number;
  unitCost: number;
}

// Fetch all products for dropdown
export async function getProducts(): Promise<Product[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT 
      "__id",
      "name",
      "default_code" as "Product_Code",
      "standard_price" as "Cost",
      "Default_BOM"
    FROM "${BASE_ID}"."Products"
    WHERE "default_code" IS NOT NULL
    ORDER BY "id" ASC
    LIMIT 500`
  );

  return rows.map((row) => {
    const defaultBom = safeParseJson(row.Default_BOM);
    return {
      id: row.__id as string,
      Name: row.name as string,
      productCode: (row.Product_Code as string) || "",
      cost: row.Cost as number | null,
      defaultBomId: defaultBom?.id || null,
      defaultBomName: defaultBom?.title || null,
    };
  });
}

// Fetch BOMs for a specific product (for Production type)
export async function getBOMsByProduct(productId: string): Promise<BOM[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT 
      "__id",
      "Name",
      "Reference",
      "Product",
      "Total_Material_Cost",
      "Quantity",
      "Status"
    FROM "${BASE_ID}"."BOM"
    --WHERE "BOM"."Product"->>"__id" = '${productId}'
    WHERE "Status" = 'Active'
    ORDER BY "Name"
    LIMIT 100`
  );

  return rows.map((row) => {
    const product = safeParseJson(row.Product);
    return {
      id: row.__id as string,
      Name: row.Name as string,
      reference: row.Reference as string | null,
      productId: product?.id || null,
      productName: product?.title || null,
      totalMaterialCost: row.Total_Material_Cost as number | null,
      quantity: row.Quantity as number | null,
      status: row.Status as string | null,
    };
  });
}

// Fetch all active BOMs (for dropdown when no product selected)
export async function getAllBOMs(): Promise<BOM[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT 
      "__id",
      "Name",
      "Reference",
      "Product",
      "Total_Material_Cost",
      "Quantity",
      "Status"
    FROM "${BASE_ID}"."BOM"
    WHERE "Status" = 'Active'
    ORDER BY "Name"
    LIMIT 200`
  );

  return rows.map((row) => {
    const product = safeParseJson(row.Product);
    return {
      id: row.__id as string,
      Name: row.Name as string,
      reference: row.Reference as string | null,
      productId: product?.id || null,
      productName: product?.title || null,
      totalMaterialCost: row.Total_Material_Cost as number | null,
      quantity: row.Quantity as number | null,
      status: row.Status as string | null,
    };
  });
}

// Fetch all active Cutting patterns
export async function getAllCuttings(): Promise<Cutting[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT 
      "__id",
      "Name",
      "Reference",
      "Status"
    FROM "${BASE_ID}"."Cutting"
    WHERE "Status" = 'Active'
    ORDER BY "Name"
    LIMIT 200`
  );

  return rows.map((row) => ({
    id: row.__id as string,
    Name: row.Name as string,
    reference: row.Reference as string | null,
    status: row.Status as string | null,
  }));
}

// Fetch Cutting lines for a specific cutting pattern
export async function getCuttingLines(cuttingId: string): Promise<CuttingLine[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT 
      "__id",
      "Product",
      "Plan_Qty"
      --"Unit_Cost",
      --"Total_Cost"
    FROM "${BASE_ID}"."Cutting_Lines"
    WHERE "${BASE_ID}"."Cutting_Lines"."Cut"->>'id' = '${cuttingId}'
    LIMIT 200`
  );

  return rows.map((row) => {
    const product = safeParseJson(row.Product);
    return {
      id: row.__id as string,
      productId: product?.id || null,
      productName: product?.title || null,
      quantity: row.Plan_Qty as number | null,
      unitCost: row.Unit_Cost as number | null,
      totalCost: row.Total_Cost as number | null,
    };
  });
}

// Fetch BOM lines for cost calculation
export async function getBOMLines(bomId: string): Promise<BOMLine[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT 
      "__id",
      "Product",
      "Quantity",
      "Unit_Cost",
      "Total_Cost"
    FROM "${BASE_ID}"."BOM_Lines"
    WHERE "${BASE_ID}"."BOM_Lines"."BOM"->>'id' = '${bomId}'
    LIMIT 200`
  );

  return rows.map((row) => {
    const product = safeParseJson(row.Product);
    return {
      id: row.__id as string,
      productId: product?.id || null,
      productName: product?.title || null,
      quantity: row.Quantity as number | null,
      unitCost: row.Unit_Cost as number | null,
      totalCost: row.Total_Cost as number | null,
    };
  });
}

// Calculate cost preview based on BOM and quantity
export async function calculateCostPreview(
  bomId: string | null,
  quantity: number,
  laborCostPerUnit: number = 0,
  machineCostPerUnit: number = 0,
  overheadCostPerUnit: number = 0
): Promise<CostPreview> {
  let rawMaterialsCost = 0;

  if (bomId) {
    console.log(`[v0] Calculating cost preview for BOM ID: ${bomId} with quantity: ${quantity}`);
    const bomLines = await getBOMLines(bomId);
    rawMaterialsCost = bomLines.reduce((sum, line) => {
      const lineCost = (line.quantity || 0) * (line.unitCost || 0);
      return sum + lineCost;
    }, 0);
    rawMaterialsCost = rawMaterialsCost * quantity;
  }

  const laborCost = laborCostPerUnit * quantity;
  const machineCost = machineCostPerUnit * quantity;
  const overheadCost = overheadCostPerUnit * quantity;
  const totalCost = rawMaterialsCost + laborCost + machineCost + overheadCost;
  const unitCost = quantity > 0 ? totalCost / quantity : 0;

  return {
    rawMaterialsCost,
    laborCost,
    machineCost,
    overheadCost,
    totalCost,
    unitCost,
  };
}

// Create MO record
export interface CreateMOInput {
  moType: "Production" | "Cutting";
  productId: string;
  quantity: number;
  bomId?: string | null;
  cuttingBomId?: string | null;
  startDate?: string;
  endDate?: string;
  laborCost?: number;
  machineCost?: number;
  overheadCost?: number;
  reference?: string;
}

export async function createMO(input: CreateMOInput) {
  const fields: Record<string, unknown> = {
    "MO_Type": input.moType, // MO Type
    "Product": [input.productId], // Product (link)
    "Quantity": input.quantity, // Quantity
    "Status": "Draft", // Status
  };

  // BOM or Cutting BOM based on type
  if (input.moType === "Production" && input.bomId) {
    fields["BOM"] = [input.bomId]; // BOM (link)
  }
  if (input.moType === "Cutting" && input.cuttingBomId) {
    fields["Cutting_BOM"] = [input.cuttingBomId]; // Cutting BOM (link)
  }

  // Dates
  if (input.startDate) {
    fields["Start_Date"] = input.startDate; // Start Date
  }
  if (input.endDate) {
    fields["End_Date"] = input.endDate; // End Date
  }

  // Costs
  if (input.laborCost !== undefined) {
    fields["Labor_Cost"] = input.laborCost; // Labor Cost
  }
  if (input.machineCost !== undefined) {
    fields["Machine_Cost"] = input.machineCost; // Machine Cost
  }
  if (input.overheadCost !== undefined) {
    fields["Overhead_Cost"] = input.overheadCost; // Overhead Cost
  }

  // Reference
  if (input.reference) {
    fields["Reference"] = input.reference; // Reference
  }

  // Created date
  fields["Created_At"] = new Date().toISOString(); // Created At

  const record = await createRecord(MO_TABLE, fields);

  // Create MO Raw Material records for BOM lines or Cutting lines
  if (input.moType === "Production" && input.bomId) {
    const bomLines = await getBOMLines(input.bomId);
    const moRawMaterialRecords = bomLines.map(line => ({
      fields: {
        "MO": [record.id], // MO (link)
        "MO_Type": input.moType, // MO Type
        "Reference": input.reference || "", // Reference
        "BOM": [input.bomId], // BOM (link)
        "Product": [line.productId], // Product (link)
        "MO_Qty": input.quantity, // MO Qty
        "Quantity": (line.quantity || 0) * input.quantity, // Quantity (scaled)
        "Cost": line.unitCost || 0, // Product Cost
      }
    }));
    if (moRawMaterialRecords.length > 0) {
      await createRecords(MO_RAW_MATERIAL_TABLE, moRawMaterialRecords);
    }
  } else if (input.moType === "Cutting" && input.cuttingBomId) {
    const cuttingLines = await getCuttingLines(input.cuttingBomId);
    const moRawMaterialRecords = cuttingLines.map(line => ({
      fields: {
        "MO": [record.id], // MO (link)
        "MO_Type": input.moType, // MO Type
        "Reference": input.reference || "", // Reference
        "CUT": [input.cuttingBomId], // CUT (link)
        "Product": [line.productId], // Product (link)
        "MO_Qty": input.quantity, // MO Qty
        "Quantity": (line.quantity || 0) * input.quantity, // Quantity (scaled)
        "Cost": line.unitCost || 0, // Product Cost
      }
    }));
    if (moRawMaterialRecords.length > 0) {
      await createRecords(MO_RAW_MATERIAL_TABLE, moRawMaterialRecords);
    }
  }

  return record;
}

// ============================================================================
// Cutting Management
// ============================================================================

export async function createCuttingFabric(data: {
  date: string;
  reference: string;
}) {
  return createRecord(CUTTING_TABLE, {
    'Date': data.date,
    'Reference': data.reference,
  });
}

export async function createCuttingPlan(data: {
  name: string;
  reference?: string;
}) {
  return createRecord(CUTTING_TABLE, {
    "Name": data.name,
    "Reference": data.reference || "",
    "Status": "Active",
  });
}

export async function updateCutting(id: string, data: {
  name?: string;
  reference?: string;
  status?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.name !== undefined) fields.Name = data.name;
  if (data.reference !== undefined) fields.Reference = data.reference;
  if (data.status !== undefined) fields.Status = data.status;
  return updateRecord(CUTTING_TABLE, id, fields);
}

export async function deleteCutting(id: string) {
  return deleteRecord(CUTTING_TABLE, id);
}

export async function createCuttingWithLines(data: {
  name: string;
  reference?: string;
  lines: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>;
}) {
  // Create the Cutting record first
  const cuttingRecord = await createCuttingFabric({
    name: data.name,
    reference: data.reference,
  });

  // Create Cutting lines
  if (data.lines.length > 0) {
    const cuttingLinesPromises = data.lines.map((line) =>
      createRecord(CUTTING_LINES_TABLE, {
        "Cut": [cuttingRecord.id], // Cutting link
        "Fabric": [line.productId], // Product
        "Plan_Qty": line.quantity, // Quantity
        // "Unit_Cost": line.unitCost, // Unit Cost
      })
    );
    await Promise.all(cuttingLinesPromises);
  }

  return cuttingRecord;
}

export async function getBOMs() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "BOM", "Version", "Quantity", "Status", "Effective_Date", "Reference", "Product"
    FROM "${BASE_ID}"."BOM"
    ORDER BY "BOM" ASC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    Name: row.BOM as string,
    version: row.Version as string,
    quantity: Number(row.Quantity || 0),
    status: row.Status as string,
    effectiveDate: row.Effective_Date as string,
    reference: row.Reference as string,
    product: safeParseJson(row.Product)?.title || "",
  }));
}

export async function createBOM(data: {
  version: string;
  quantity: number;
  status: string;
  effectiveDate: string;
  reference: string;
}) {
  return createRecord("${BASE_ID}.BOM_Lines", {
    fld0VdSDfuO9aUlG55s: data.version,
    fldXoofJqfxsI38hfhd: data.quantity,
    fldooU78f6gHZ362PtW: data.status,
    fldSKhzNnNJqDWQDOlZ: data.effectiveDate,
    fldV1cUu57SObBr8XId: data.reference,
  });
}

export async function updateBOM(id: string, data: {
  version?: string;
  quantity?: number;
  status?: string;
  effectiveDate?: string;
  reference?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.version !== undefined) fields.Version = data.version;
  if (data.quantity !== undefined) fields.Quantity = data.quantity;
  if (data.status !== undefined) fields.Status = data.status;
  if (data.effectiveDate !== undefined) fields.Effective_Date = data.effectiveDate;
  if (data.reference !== undefined) fields.Reference = data.reference;
  return updateRecord(BOM_TABLE, id, fields);
}

export async function deleteBOM(id: string) {
  return deleteRecord(BOM_TABLE, id);
}

export async function createBOMWithLines(data: {
  productId: string;
  quantity: number;
  reference: string;
  lines: Array<{
    productId: string;
    qty: number;
    quantity: number;
    unitId: string;
    hookLoopItemIds?: string[];
  }>;
}) {
  // Create the BOM record first
  const bomRecord = await createRecord("tbljVE4fCX1GxrlZOlO", {
    fldehyTSNV6w3jgHqP5: data.productId, // Product
    fldXoofJqfxsI38hfhd: data.quantity, // Quantity
    fldV1cUu57SObBr8XId: data.reference, // Reference
    fldooU78f6gHZ362PtW: "Draft", // Status
  });

  // Create BOM lines
  const bomLinesPromises = data.lines.map((line) =>
    createRecord("tblxWum7GLIpaEotAr4", {
      fldAxfVf6D1pCuq0oDh: bomRecord.id, // BOM link
      fldTHdnKDwuPEJzAFkf: line.productId, // Product
      fldmrDNm4ygWpKLAtXA: line.qty, // Item Count
      fldK7S10zg59EtFbHqg: line.quantity, // Quantity
      fldUelLsvIJaKggNrlS: line.unitId, // UoM
      ...(line.hookLoopItemIds && line.hookLoopItemIds.length > 0
        ? { fldwEsz0DQDCqIuQHyM: line.hookLoopItemIds }
        : {}),
    })
  );

  await Promise.all(bomLinesPromises);

  return bomRecord;
}



/**
 * Get BOM with all its lines
 */
export async function getBOMWithLines(bomId: string) {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT 
      b."__id" as "bom_id",
      b."BOM" as "bom_Name",
      b."Total_Material_Cost" as "total_cost",
      b."Status" as "status",
      bl."__id" as "line_id",
      bl."Product" as "product_json",
      bl."Quantity" as "quantity",
      bl."Unit_Cost" as "unit_cost",
      bl."Total_Cost" as "line_total_cost"
    FROM "${BASE_ID}"."BOM" b
    LEFT JOIN "${BASE_ID}"."BOM_Lines" bl ON b."__id" = bl."BOM"
    WHERE b."__id" = '${bomId}'
    ORDER BY bl."Quantity" DESC
  `);

  return {
    bom: rows[0] ? {
      id: rows[0].bom_id as string,
      Name: rows[0].bom_Name as string,
      totalCost: Number(rows[0].total_cost || 0),
      status: rows[0].status as string,
    } : null,
    lines: rows
      .filter(row => row.line_id)
      .map(row => ({
        id: row.line_id as string,
        productName: safeParseJson(row.product_json)?.title || "",
        quantity: Number(row.quantity || 0),
        unitCost: Number(row.unit_cost || 0),
        totalCost: Number(row.line_total_cost || 0),
      })),
  };
}

/**
 * Get all BOMs for a product
 */
// export async function getBOMsByProduct(productId: string) {
//   const { rows } = await sqlQuery(BASE_ID, `
//     SELECT "__id", "BOM" as "Name", "Version" as "version", "Status" as "status", "Total_Material_Cost" as "total_cost"
//     FROM "${BASE_ID}"."BOM"
//     WHERE "__fk_fldcKWcxXFLKHBkqJxT" = '${productId}' OR "Product" LIKE '%${productId}%'
//     ORDER BY "Version" DESC
//     LIMIT 100
//   `);

//   return rows.map(row => ({
//     id: row.__id as string,
//     Name: row.Name as string,
//     version: row.version as string,
//     status: row.status as string,
//     totalCost: Number(row.total_cost || 0),
//   }));
// }

/**
 * Calculate total cost for a BOM including all levels
 */
export async function calculateBOMTotalCost(bomId: string): Promise<number> {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT COALESCE(SUM(CAST("Total_Cost" AS numeric)), 0) as "total"
    FROM "${BASE_ID}"."BOM_Lines"
    WHERE "__fk_fldAxfVf6D1pCuq0oDh" = '${bomId}'
  `);

  return Number(rows[0]?.total || 0);
}

/**
 * Explode BOM into all raw materials (flattened view)
 */
export async function exploseBOM(bomId: string, quantity: number = 1, level: number = 0, visitedBOMs: Set<string> = new Set()): Promise<BOMLineItem[]> {
  // Prevent circular references
  if (visitedBOMs.has(bomId) || level > 5) {
    return [];
  }

  visitedBOMs.add(bomId);

  const { rows } = await sqlQuery(BASE_ID, `
    SELECT 
      bl."__id" as "line_id",
      bl."Product" as "product_json",
      bl."Quantity" as "qty_per_unit",
      bl."Unit_Cost" as "unit_cost",
      bl."Name" as "line_Name",
      p."__id" as "product_id",
      p."Name" as "product_Name"
    FROM "${BASE_ID}"."BOM_Lines" bl
    LEFT JOIN "${BASE_ID}"."Products" p ON p."__id" = bl."__fk_fldTHdnKDwuPEJzAFkf"
    WHERE bl."__fk_fldAxfVf6D1pCuq0oDh" = '${bomId}'
    LIMIT 500
  `);

  const explosedItems: BOMLineItem[] = [];

  for (const row of rows) {
    const qtyForThisLevel = Number(row.qty_per_unit || 0) * quantity;
    const unitCost = Number(row.unit_cost || 0);

    explosedItems.push({
      id: row.line_id as string,
      Name: row.line_Name as string,
      productId: row.product_id as string,
      productName: row.product_Name as string || safeParseJson(row.product_json)?.title || "",
      quantity: qtyForThisLevel,
      unitCost: unitCost,
      totalCost: qtyForThisLevel * unitCost,
      level: level,
      parentBOMId: bomId,
    });
  }

  return explosedItems;
}

/**
 * Detect circular references in BOM hierarchy
 */
export async function checkBOMCircularReference(bomId: string, parentBomId?: string): Promise<{ hasCircular: boolean; path: string[] }> {
  const visitedBOMs = new Set<string>();
  const path: string[] = [bomId];

  async function traverse(currentBomId: string): Promise<boolean> {
    if (visitedBOMs.has(currentBomId)) {
      return true; // Circular reference found
    }

    visitedBOMs.add(currentBomId);

    const { rows } = await sqlQuery(BASE_ID, `
      SELECT DISTINCT "__fk_fldAxfVf6D1pCuq0oDh" as "parent_bom"
      FROM "${BASE_ID}"."BOM_Lines"
      WHERE "__fk_fldAxfVf6D1pCuq0oDh" = '${currentBomId}'
      LIMIT 50
    `);

    for (const row of rows) {
      if (row.parent_bom) {
        path.push(row.parent_bom as string);
        if (await traverse(row.parent_bom as string)) {
          return true;
        }
        path.pop();
      }
    }

    return false;
  }

  const hasCircular = await traverse(bomId);
  return { hasCircular, path };
}

// ============================================================================
// Cutting Requests
// ============================================================================

export async function createCutting(data: {
  date: string;
  reference: string;
}) {
  return createRecord(CUTTING_REQUEST_TABLE, {
    'Date': data.date,
    'MO_No': data.reference,
  });
}

export interface CuttingTubLine {
  productId: string;
  quantity: number;
  unitId: string;
  notes?: string;
}

export interface CuttingHookLoopLine {
  itemId: string;
  length: number;
  quantity: number;
  notes?: string;
}

export interface RequestItemLine {
  productId: string;
  productName: string;
  lotNo: string;
  quantity: number;
  unitId: string;
  status?: string;
}

export interface RequestRMRecord {
  id: string;
  date: string | null;
  time: string | null;
  status: string | null;
  employeeName: string;
  moRef: string;
  itemsCount: number;
}

export async function getRequestRMRecords(): Promise<RequestRMRecord[]> {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT
      "__id",
      "Date",
      "Time",
      "Status",
      "Employee",
      "MO_No",
      "Request_Items"
    FROM "${BASE_ID}"."Request_RM"
    ORDER BY "Date" DESC, "Time" DESC
    LIMIT 200
  `);

  return rows.map((row) => {
    const employee = safeParseJson(row.Employee);
    const mo = safeParseJson(row.MO_No);
    const items = safeParseJson(row.Request_Items) || [];

    return {
      id: row.__id as string,
      date: row.Date as string | null,
      time: row.Time as string | null,
      status: row.Status as string | null,
      employeeName: employee?.title || "",
      moRef: mo?.title || "",
      itemsCount: Array.isArray(items) ? items.length : 0,
    };
  });
}

export async function createRequestRM(data: {
  Date: string;
  Time: string;
  status: string;
  // employeeId?: string;
  // moId?: string;
  lines: RequestItemLine[];
}) {
  const rm = await createRecord(REQUEST_RM_TABLE, {
    Date: data.Date,
    Time: data.Time,
    Status: data.status,
    // ...(data.employeeId ? { Employee: [data.employeeId] } : {}),
    // ...(data.moId ? { MO_No: [data.moId] } : {}),
  });

  if (data.lines.length > 0) {
    const itemRecords = data.lines.map((line) => ({
      fields: {
        Production_Request: [rm.id],
        Product: line.productName,
        Lot_No: line.lotNo,
        Quantity: line.quantity,
        Unit: [line.unitId],
        Status: line.status || "Requested",
      },
    }));

    await createRecords(REQUEST_ITEM_TABLE, itemRecords);
  }

  return { success: true, rmId: rm.id };
}


export async function createCuttingRequest(data: {
  Date: string;
  reference: string;
  tubLines: CuttingTubLine[];
  hookLoopLines: CuttingHookLoopLine[];
}) {
  // 1. Create MO Header (Type: Cutting)
  const cut = await createCutting({
    date: data.Date ? data.Date : new Date().toISOString(),
    reference: data.reference,
  });

  // 2. Create Tub Lines (Assuming table: Cutting_Tub_Lines)
  if (data.tubLines.length > 0) {
    const tubRecords = data.tubLines.map(line => ({
      fields: {
        "Cutting_Request": [cut.id],
        "Item": [line.productId],
        "Qty": line.quantity,
        // "UoM": [line.unitId],
        // "Notes": line.notes || ""
      }
    }));
    await createRecords(CUTTING_TUB_LINES_TABLE, tubRecords);
  }

  // 3. Create Hook & Loop Lines (Assuming table: Cutting_HL_Lines)
  if (data.hookLoopLines.length > 0) {
    const hlRecords = data.hookLoopLines.map(line => ({
      fields: {
        "Cutting_Request": [cut.id],
        "Item": [line.itemId],
        // "Length": line.length,
        "Quantity": line.quantity,
        // "Notes": line.notes || ""
      }
    }));
    await createRecords(CUTTING_HOOK_LOOP_LINES_TABLE, hlRecords);
  }

  return { success: true, moId: cut.id };
}