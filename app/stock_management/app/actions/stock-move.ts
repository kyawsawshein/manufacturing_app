"use server";

import { sqlQuery, createRecord } from "@/lib/teable";

const BASE_ID = process.env.BASE_ID || "bseTIY0IrZr61kt6u5E";

// Table IDs
const STOCK_MOVE_TABLE = "tblJsQ6bIiXdQg8a7ki";
const STOCK_MOVE_LINE_TABLE = "tblhSAYQBm7hsA2D1ne";

// Field IDs for Stock Move
const SM_OPERATION_TYPE = "fldgxbXiyMoy6nwNzLa";
const SM_SOURCE_LOCATION = "fldn2A3hqvMM6HUvIMX";
const SM_DESTINATION_LOCATION = "fldd98GM8FEoQZWWFWx";
const SM_DATE = "fldR5mMdxSawi1mjQDS";
const SM_STATUS = "fldMgugISQudz49hBnW";
const SM_PARTNER = "fld9CzbQ7ufBdZBOija";
const SM_BATCH_NUMBER = "fldDDQj9DVfkshkDhrM";

// Field IDs for Stock Move Line
const SML_PRODUCT = "fldHvTo8Pl15xds98oC";
const SML_QUANTITY = "fldfVXXiUcxJGqLLh86";
const SML_UNIT = "fldlghK8abG2F3NUc0Q";
const SML_STOCK_MOVE = "fldnG4OPP7two3M7TOc";
const SML_LOT_NO = "fldpRHDt5kBbaBC2PnN";
const SML_EXPIRY_DATE = "fldVffW3pZkJwIGNdmL";

export interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
}

export interface Partner {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface OperationType {
  id: string;
  name: string;
  code: string;
  transactionType: string;
}

export interface StockLot {
  id: string;
  lot: string;
  expiryDate?: string;
}

export interface StockMoveLine {
  productId: string;
  quantity: number;
  unitId: string;
  lotId?: string;
  expiryDate?: string;
}

export interface StockMoveInput {
  operationTypeId: string;
  partnerId?: string;
  sourceLocationId: string;
  destinationLocationId: string;
  date: string;
  batchNumber?: string;
  lines: StockMoveLine[];
}

export async function getLocations(): Promise<Location[]> {
  try {
    // Join with Location_Types to get the Type value
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT l."__id", l."Location_Name", l."Code", lt."Type" as "LocationType"
       FROM "${BASE_ID}"."Locations" l
       LEFT JOIN "${BASE_ID}"."Location_Types" lt 
         ON l."Location_Type"->0->>'id' = lt."__id"
       WHERE l."Status" = 'Active' OR l."Status" IS NULL
       ORDER BY l."Location_Name"
       LIMIT 500`
    );

    console.log("[v0] getLocations rows:", rows.length);

    return rows.map((row) => ({
      id: row.__id as string,
      name: (row.Location_Name as string) || (row.Code as string) || "Unknown",
      code: (row.Code as string) || "",
      type: (row.LocationType as string) || "",
    }));
  } catch (error) {
    console.error("[v0] getLocations error:", error);
    return [];
  }
}

export async function getLocationsByType(locationType: string): Promise<Location[]> {
  try {
    // Join with Location_Types to filter by Type value
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT l."__id", l."Location_Name", l."Code", lt."Type" as "LocationType"
       FROM "${BASE_ID}"."Locations" l
       LEFT JOIN "${BASE_ID}"."Location_Types" lt 
         ON l."Location_Type"->0->>'id' = lt."__id"
       WHERE lt."Type" = '${locationType}'
       AND (l."Status" = 'Active' OR l."Status" IS NULL)
       ORDER BY l."Location_Name"
       LIMIT 500`
    );

    console.log("[v0] getLocationsByType", locationType, "rows:", rows.length);

    return rows.map((row) => ({
      id: row.__id as string,
      name: (row.Location_Name as string) || (row.Code as string) || "Unknown",
      code: (row.Code as string) || "",
      type: (row.LocationType as string) || "",
    }));
  } catch (error) {
    console.error("[v0] getLocationsByType error:", error);
    return [];
  }
}

export async function getPartners(): Promise<Partner[]> {
  try {
    // Note: Name field has dbFieldName "Name" (typo in DB)
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT "__id", "name" AS "Name"
       FROM "${BASE_ID}"."Partners"
       ORDER BY "Name"
       LIMIT 500`
    );

    console.log("[v0] getPartners rows:", rows.length);

    return rows.map((row) => ({
      id: row.__id as string,
      name: (row.Name as string) || "Unknown",
    }));
  } catch (error) {
    console.error("[v0] getPartners error:", error);
    return [];
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT "__id", "Label" AS "SKU", "name"
       FROM "${BASE_ID}"."Products"
       ORDER BY "Label"
       LIMIT 1000`
    );

    console.log("[v0] getProducts rows:", rows.length);

    return rows.map((row) => ({
      id: row.__id as string,
      sku: (row.SKU as string) || "",
      name: (row.Name as string) || "",
    }));
  } catch (error) {
    console.error("[v0] getProducts error:", error);
    return [];
  }
}

export async function getUnits(): Promise<Unit[]> {
  try {
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT "__id", "Name"
       FROM "${BASE_ID}"."Units_of_Measure"
       ORDER BY "Name"
       LIMIT 100`
    );

    console.log("[v0] getUnits rows:", rows.length);

    return rows.map((row) => ({
      id: row.__id as string,
      name: (row.Name as string) || "Unknown",
    }));
  } catch (error) {
    console.error("[v0] getUnits error:", error);
    return [];
  }
}

export async function getOperationTypes(): Promise<OperationType[]> {
  try {
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT "__id", "Name", "Code", "Transaction_Type"
       FROM "${BASE_ID}"."Operation_Type"
       ORDER BY "Name"
       LIMIT 100`
    );

    console.log("[v0] getOperationTypes rows:", rows.length);

    return rows.map((row) => ({
      id: row.__id as string,
      name: (row.Name as string) || "Unknown",
      code: (row.Code as string) || "",
      transactionType: (row.Transaction_Type as string) || "",
    }));
  } catch (error) {
    console.error("[v0] getOperationTypes error:", error);
    return [];
  }
}

export async function getOperationTypesByTransaction(transactionType: string): Promise<OperationType[]> {
  try {
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT "__id", "Name", "Code", "Transaction_Type"
       FROM "${BASE_ID}"."Operation_Type"
       WHERE "Transaction_Type" = '${transactionType}'
       ORDER BY "Name"
       LIMIT 100`
    );

    console.log("[v0] getOperationTypesByTransaction", transactionType, "rows:", rows.length);

    return rows.map((row) => ({
      id: row.__id as string,
      name: (row.Name as string) || "Unknown",
      code: (row.Code as string) || "",
      transactionType: (row.Transaction_Type as string) || "",
    }));
  } catch (error) {
    console.error("[v0] getOperationTypesByTransaction error:", error);
    return [];
  }
}

export async function getStockLots(): Promise<StockLot[]> {
  try {
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT "__id", "name" as "Lot", "Expiry_Date"
       FROM "${BASE_ID}"."Stock_Lot"
       WHERE "name" IS NOT NULL
       ORDER BY "Expiry_Date"
       LIMIT 500`
    );

    console.log("[v0] getStockLots rows:", rows.length);

    return rows.map((row) => ({
      id: row.__id as string,
      lot: (row.Lot as string) || "",
      expiryDate: (row.Expiry_Date as string) || undefined,
    }));
  } catch (error) {
    console.error("[v0] getStockLots error:", error);
    return [];
  }
}

export async function createStockMove(input: StockMoveInput): Promise<{ success: boolean; reference?: string; error?: string }> {
  try {
    // Create Stock Move record
    const stockMoveFields: Record<string, unknown> = {
      [SM_OPERATION_TYPE]: [input.operationTypeId],
      [SM_SOURCE_LOCATION]: [input.sourceLocationId],
      [SM_DESTINATION_LOCATION]: [input.destinationLocationId],
      [SM_DATE]: input.date,
      [SM_STATUS]: "Draft",
    };

    if (input.partnerId) {
      stockMoveFields[SM_PARTNER] = [input.partnerId];
    }

    if (input.batchNumber) {
      stockMoveFields[SM_BATCH_NUMBER] = input.batchNumber;
    }

    const stockMove = await createRecord(STOCK_MOVE_TABLE, stockMoveFields);
    const stockMoveId = stockMove.id;

    // Create Stock Move Line records
    for (const line of input.lines) {
      const lineFields: Record<string, unknown> = {
        [SML_PRODUCT]: [line.productId],
        [SML_QUANTITY]: line.quantity,
        [SML_UNIT]: [line.unitId],
        [SML_STOCK_MOVE]: [stockMoveId],
      };

      if (line.lotId) {
        lineFields[SML_LOT_NO] = [line.lotId];
      }

      if (line.expiryDate) {
        lineFields[SML_EXPIRY_DATE] = line.expiryDate;
      }

      await createRecord(STOCK_MOVE_LINE_TABLE, lineFields);
    }

    // Get the reference from the created record
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT "Quantity" as "Name" FROM "${BASE_ID}"."Stock_Movements" WHERE "__id" = '${stockMoveId}' LIMIT 1`
    );

    const reference = (rows[0]?.Name as string) || stockMoveId;

    return { success: true, reference };
  } catch (error) {
    console.error("[v0] Error creating stock move:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
