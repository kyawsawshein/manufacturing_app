"use server";

import { sqlQuery, createRecord, safeParseJson } from "@/lib/teable";

const BASE_ID = "bseTIY0IrZr61kt6u5E";

export interface Product {
  id: string;
  name: string;
  productCode: string;
  cost: number | null;
  defaultBomId: string | null;
  defaultBomName: string | null;
}

export interface BOM {
  id: string;
  name: string;
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
      "Name",
      "Product_Code",
      "Cost",
      "Default_BOM"
    FROM "bseTIY0IrZr61kt6u5E"."Product"
    WHERE "Name" IS NOT NULL
    ORDER BY "Name"
    LIMIT 500`
  );

  return rows.map((row) => {
    const defaultBom = safeParseJson(row.Default_BOM);
    return {
      id: row.__id as string,
      name: row.Name as string,
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
    FROM "bseTIY0IrZr61kt6u5E"."BOM"
    WHERE "__fk_fldsa7kbXvPPWD0ni8s" = '${productId}'
      AND "Status" = 'Active'
    ORDER BY "Name"
    LIMIT 100`
  );

  return rows.map((row) => {
    const product = safeParseJson(row.Product);
    return {
      id: row.__id as string,
      name: row.Name as string,
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
    FROM "bseTIY0IrZr61kt6u5E"."BOM"
    WHERE "Status" = 'Active'
    ORDER BY "Name"
    LIMIT 200`
  );

  return rows.map((row) => {
    const product = safeParseJson(row.Product);
    return {
      id: row.__id as string,
      name: row.Name as string,
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
    FROM "bseTIY0IrZr61kt6u5E"."BOM_Lines"
    WHERE "__fk_fldAxfVf6D1pCuq0oDh" = '${bomId}'
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
