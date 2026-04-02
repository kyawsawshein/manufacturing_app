"use server";

import { sqlQuery, createRecord } from "@/lib/teable";

const BASE_ID = "bseTIY0IrZr61kt6u5E";

// Table IDs
const SALES_ORDERS_TABLE = "tblcgaHqcge0NObcHGF";
const SALES_ORDER_LINES_TABLE = "tbl89A4Ps2lwrMui6vC";

export interface Partner {
  id: string;
  name: string;
}

export interface CustomerPO {
  id: string;
  label: string;
}

export interface Location {
  id: string;
  locationCode: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  salePrice: number | null;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
}

export async function getPartners(): Promise<Partner[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Naem" FROM "bseTIY0IrZr61kt6u5E"."Partners" WHERE "Naem" IS NOT NULL ORDER BY "Naem" LIMIT 500`
  );
  return rows.map((row) => ({
    id: row.__id as string,
    name: row.Naem as string,
  }));
}

export async function getCustomerPOs(): Promise<CustomerPO[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Label" FROM "bseTIY0IrZr61kt6u5E"."Customer_PO" WHERE "Label" IS NOT NULL ORDER BY "Label" LIMIT 500`
  );
  return rows.map((row) => ({
    id: row.__id as string,
    label: row.Label as string,
  }));
}

export async function getLocations(): Promise<Location[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Code" FROM "bseTIY0IrZr61kt6u5E"."Locations" WHERE "Code" IS NOT NULL ORDER BY "Code" LIMIT 500`
  );
  return rows.map((row) => ({
    id: row.__id as string,
    locationCode: row.Code as string,
  }));
}

export async function getProducts(): Promise<Product[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "SKU", "Name", "Sale_Price" FROM "bseTIY0IrZr61kt6u5E"."Products" WHERE "SKU" IS NOT NULL ORDER BY "SKU" LIMIT 1000`
  );
  return rows.map((row) => ({
    id: row.__id as string,
    sku: row.SKU as string,
    name: row.Name as string,
    salePrice: row.Sale_Price as number | null,
  }));
}

export async function getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Name" FROM "bseTIY0IrZr61kt6u5E"."Units_of_Measure" WHERE "Name" IS NOT NULL ORDER BY "Name" LIMIT 100`
  );
  return rows.map((row) => ({
    id: row.__id as string,
    name: row.Name as string,
  }));
}

export interface SalesOrderInput {
  customerId: string;
  poNoId: string;
  orderDate: string;
  deliveryDate?: string;
  sourceLocationId?: string;
  isKitOrder: boolean;
}

export interface SalesOrderLineInput {
  productId: string;
  qty: number;
  unitPrice: number;
  unitId?: string;
  jobNo?: string;
}

export interface CreateSalesOrderResult {
  success: boolean;
  soReference?: string;
  error?: string;
}

export async function createSalesOrder(
  header: SalesOrderInput,
  lines: SalesOrderLineInput[]
): Promise<CreateSalesOrderResult> {
  try {
    // Create the Sales Order header
    // Field IDs from schema:
    // - fldLQtTSQ23wo4MR4KY: Customer (link)
    // - fld4hpPakgQCl9NsKBd: PO.No (link)
    // - fldXsIxa7eAgL9VuMXK: Order Date
    // - fld47ona6fn0lPVXY3t: Delivery Date
    // - fldwmdi4GZp0fQdzcpq: Source Location (link)
    // - fldPElTrU699ziuuAk4: Is Kit Order (checkbox)
    // - fld5vmAcv2IhusCGyX5: Status
    
    const soFields: Record<string, unknown> = {
      fldLQtTSQ23wo4MR4KY: [header.customerId], // Link field - array of record IDs
      fld4hpPakgQCl9NsKBd: [header.poNoId], // Link field - array of record IDs
      fldXsIxa7eAgL9VuMXK: header.orderDate,
      fld5vmAcv2IhusCGyX5: "Draft",
      fldPElTrU699ziuuAk4: header.isKitOrder,
    };

    if (header.deliveryDate) {
      soFields.fld47ona6fn0lPVXY3t = header.deliveryDate;
    }

    if (header.sourceLocationId) {
      soFields.fldwmdi4GZp0fQdzcpq = [header.sourceLocationId];
    }

    const salesOrder = await createRecord(SALES_ORDERS_TABLE, soFields);
    const salesOrderId = salesOrder.id;

    // Create all Sales Order Lines
    // Field IDs from schema:
    // - fldXgnX2GTFMLmF3JBd: Product (link)
    // - fldyf6OcNXHcxBHj1Ph: Qty
    // - fldIFeM8pR0U88HMuIA: Unit Price
    // - flds2xvXtzdUb6Zuoxn: Unit (link) - this is a lookup field, may not be writable
    // - fld2ZhQs5dc98T6Umyt: Job No
    // - fldtk9PIQOymWmECGzn: Sales Orders (link to SO - this links back to the SO)

    for (const line of lines) {
      const lineFields: Record<string, unknown> = {
        fldXgnX2GTFMLmF3JBd: [line.productId], // Product link
        fldyf6OcNXHcxBHj1Ph: line.qty,
        fldIFeM8pR0U88HMuIA: line.unitPrice,
        fldtk9PIQOymWmECGzn: [salesOrderId], // Link to Sales Order
      };

      if (line.jobNo) {
        lineFields.fld2ZhQs5dc98T6Umyt = line.jobNo;
      }

      await createRecord(SALES_ORDER_LINES_TABLE, lineFields);
    }

    // Get the SO Reference (Naem field is auto-generated formula: "SO-{ID}")
    const { rows } = await sqlQuery(
      BASE_ID,
      `SELECT "Naem" FROM "bseTIY0IrZr61kt6u5E"."Sales_Orders" WHERE "__id" = '${salesOrderId}' LIMIT 1`
    );

    const soReference = rows[0]?.Naem as string || `SO-${salesOrderId}`;

    return {
      success: true,
      soReference,
    };
  } catch (error) {
    console.error("Error creating sales order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
