"use server";

import { sqlQuery, createRecord, createRecords, safeParseJson } from "@/lib/teable";

const BASE_ID = process.env.BASE_ID || "bseTIY0IrZr61kt6u5E";

// Table IDs
const PURCHASE_ORDERS_TABLE = "tblcfnWU8Vb7dNtJEZo";
const PURCHASE_ORDER_LINES_TABLE = "tbluZE3J00gmOtjq719";

// Field IDs for Purchase Orders
const PO_FIELDS = {
  orderDate: "fldjUzQO0h5NVeg0WRw",
  expectedDelivery: "fldUbiCzmCzytWp0tql",
  status: "fldn8PbkmTGKthr7yi1",
  destination: "fldn05Btl7SBglM2ssf",
  vendor: "fldAVHkTHmSW8YGh3Ch",
};

// Field IDs for Purchase Order Lines
const PO_LINE_FIELDS = {
  unitPrice: "fldHcuQNPAO1ltkQQXA",
  qty: "fldenln9JGkZgj2YyLu",
  product: "fldml3ZknEZ47NeAMAK",
  po: "fldhoLZOVCf7rEaosMH",
};

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface Location {
  id: string;
  code: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  cost: number;
  uom: string | null;
}

export interface Unit {
  id: string;
  name: string;
  uom: string | null;
}

export interface OrderLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit: string | null;
  subtotal: number;
}

export async function getVendors(): Promise<Vendor[]> {
  // Note: Partners table has "Naem" as the dbFieldName for "Name" field (typo in schema)
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Naem", "Email", "Phone" 
     FROM "${BASE_ID}"."Partners" 
     WHERE "Type" = 'Vendor'
     ORDER BY "Naem" 
     LIMIT 200`
  );

  return rows.map((row) => ({
    id: row.__id as string,
    name: (row.Naem as string) || "Unnamed Vendor",
    email: row.Email as string | null,
    phone: row.Phone as string | null,
  }));
}

export async function getLocations(): Promise<Location[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Code", "Description" 
     FROM "${BASE_ID}"."Locations" 
     WHERE "Status" = 'Active'
     ORDER BY "Code" 
     LIMIT 200`
  );

  return rows.map((row) => ({
    id: row.__id as string,
    code: (row.Code as string) || "",
    name: (row.Description as string) || (row.Code as string) || "Unknown Location",
  }));
}

export async function getProducts(): Promise<Product[]> {
  // Get products - UoM is a computed lookup field so we cannot query it via SQL
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "SKU", "Name", "Cost"
     FROM "${BASE_ID}"."Products"
     ORDER BY "SKU" 
     LIMIT 500`
  );

  return rows.map((row) => ({
    id: row.__id as string,
    sku: (row.SKU as string) || "",
    name: (row.Name as string) || "Unnamed Product",
    cost: (row.Cost as number) || 0,
    uom: null, // UoM is a lookup field and cannot be queried via SQL
  }));
}

export async function getUnits(): Promise<Unit[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Name", "UOM" 
     FROM "${BASE_ID}"."Units_of_Measure" 
     ORDER BY "Name" 
     LIMIT 100`
  );

  return rows.map((row) => ({
    id: row.__id as string,
    name: (row.Name as string) || "",
    uom: row.UOM as string | null,
  }));
}

export interface CreatePurchaseOrderInput {
  vendorId: string;
  orderDate: string;
  expectedDelivery: string;
  destinationId: string;
  lines: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput
): Promise<{ success: boolean; poReference?: string; error?: string }> {
  try {
    // Validate input
    if (!input.vendorId) {
      return { success: false, error: "Vendor is required" };
    }
    if (!input.orderDate) {
      return { success: false, error: "Order date is required" };
    }
    if (!input.destinationId) {
      return { success: false, error: "Destination location is required" };
    }
    if (!input.lines || input.lines.length === 0) {
      return { success: false, error: "At least one order line is required" };
    }

    // Create the Purchase Order header
    const poRecord = await createRecord(PURCHASE_ORDERS_TABLE, {
      [PO_FIELDS.vendor]: [input.vendorId],
      [PO_FIELDS.orderDate]: input.orderDate,
      [PO_FIELDS.expectedDelivery]: input.expectedDelivery || null,
      [PO_FIELDS.destination]: [input.destinationId],
      [PO_FIELDS.status]: "Draft",
    });

    const poId = poRecord.id;

    // Create all Purchase Order Lines
    const lineRecords = input.lines.map((line) => ({
      fields: {
        [PO_LINE_FIELDS.product]: [line.productId],
        [PO_LINE_FIELDS.qty]: line.quantity,
        [PO_LINE_FIELDS.unitPrice]: line.unitPrice,
        [PO_LINE_FIELDS.po]: [poId],
      },
    }));

    await createRecords(PURCHASE_ORDER_LINES_TABLE, lineRecords);

    // Get the PO Reference from the created record
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT "ID" FROM "${BASE_ID}"."Purchase_Orders" WHERE "__id" = '${poId}' LIMIT 1`
    );

    const poReference = rows[0]?.PO_Reference as string || poId;

    return { success: true, poReference };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create purchase order",
    };
  }
}
