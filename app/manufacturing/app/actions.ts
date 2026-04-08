"use server";

import { sqlQuery, createRecord, updateRecord, deleteRecord, safeParseJson } from "@/lib/teable";

const BASE_ID = process.env.BASE_ID || "${BASE_ID}";
const BOM_LINE = process.env.BOM_LINE;
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
    -- WHERE "__fk_fldsa7kbXvPPWD0ni8s" = '${productId}'
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
    WHERE "${BASE_ID}"."BOM_Lines"."BOM" = '${bomId}'
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
    fldbFr38YcvMjKMxvqV: input.moType, // MO Type
    fldOCAJQrX6kHRrGHkh: [input.productId], // Product (link)
    fldol1eNL6A8B3OQDqe: input.quantity, // Quantity
    fldmtKVIvDWxly1H2TL: "Draft", // Status
  };

  // BOM or Cutting BOM based on type
  if (input.moType === "Production" && input.bomId) {
    fields.fldP9sMkMfZcGfdKJp1 = [input.bomId]; // BOM (link)
  }
  if (input.moType === "Cutting" && input.cuttingBomId) {
    fields.fldfXFqu8fX4QmI6vfh = [input.cuttingBomId]; // Cutting BOM (link)
  }

  // Dates
  if (input.startDate) {
    fields.fldL0wAAZUeCcuEavOz = input.startDate; // Start Date
  }
  if (input.endDate) {
    fields.fldEBTh6KseVZSBSxKS = input.endDate; // End Date
  }

  // Costs
  if (input.laborCost !== undefined) {
    fields.fldYgVpUpKBCmgrIopp = input.laborCost; // Labor Cost
  }
  if (input.machineCost !== undefined) {
    fields.fldRk5Jcwdork1hTNax = input.machineCost; // Machine Cost
  }
  if (input.overheadCost !== undefined) {
    fields.flds9oyt9ct44exn28O = input.overheadCost; // Overhead Cost
  }

  // Reference
  if (input.reference) {
    fields.fldjlZSCHctyvCAEVjb = input.reference; // Reference
  }

  // Created date
  fields.fldj3eqIJczvShgA1yc = new Date().toISOString(); // Created At

  const record = await createRecord("tblPbvDgbuKgA55boy8", fields);
  return record;
}

// ============================================================================
// BOM (Bill of Materials)
// ============================================================================

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
  if (data.version !== undefined) fields.fld0VdSDfuO9aUlG55s = data.version;
  if (data.quantity !== undefined) fields.fldXoofJqfxsI38hfhd = data.quantity;
  if (data.status !== undefined) fields.fldooU78f6gHZ362PtW = data.status;
  if (data.effectiveDate !== undefined) fields.fldSKhzNnNJqDWQDOlZ = data.effectiveDate;
  if (data.reference !== undefined) fields.fldV1cUu57SObBr8XId = data.reference;
  return updateRecord(`${BASE_ID}.BOM_Lines`, id, fields);
}

export async function deleteBOM(id: string) {
  return deleteRecord(`${BASE_ID}.BOM_Lines`, id);
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
    LEFT JOIN "${BASE_ID}"."BOM_Lines" bl ON b."__id" = bl."__fk_fldAxfVf6D1pCuq0oDh"
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