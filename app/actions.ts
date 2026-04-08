"use server";

import { sqlQuery, createRecord, updateRecord, deleteRecord, safeParseJson } from "@/lib/teable";

const BASE_ID = process.env.BASE_ID || "bsez0Y8svP1AV6SJyPa";
const PRODUCT = "tbl4j50Luypz4duYYuu";

// PURCHASE
const PURCHASE_ORDERS_TABLE = "tbl4jLMZSZNyBfexxmK";
const PURCHASE_ORDER_LINES_TABLE = "tblGo3vGQ2Zr7aVPmQK";

// SALES
const SALES_ORDERS_TABLE = "tblbHH0u4LuH0Po7IJR";
const SALES_ORDER_LINES_TABLE = "tblvZe8sZ0CRrb9HdHw";

// Partners
const PARTNERS_TABLE = "tblOAipmI1dGH83Ox4t";

// ============================================================================
// Dashboard Stats
// ============================================================================

export async function getDashboardStats() {
  const [employees, departments, products, purchaseOrders, salesOrders, manufacturingOrders] = await Promise.all([
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count" FROM "${BASE_ID}"."Employees" WHERE "Status" = 'Active'`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count" FROM "${BASE_ID}"."Departments" WHERE "Status" = 'Active'`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count" FROM "${BASE_ID}"."Products"`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count", COALESCE(SUM(CAST("Total_Amount" AS numeric)), 0) as "total" FROM "${BASE_ID}"."Purchase_Orders" WHERE "Status" != 'Cancelled'`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count", COALESCE(SUM(CAST("Total_Amount" AS numeric)), 0) as "total" FROM "${BASE_ID}"."Sales_Orders" WHERE "Status" != 'Cancelled'`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count" FROM "${BASE_ID}"."MO" WHERE "Status" NOT IN ('Done', 'Cancel')`),
  ]);

  return {
    employees: Number(employees.rows[0]?.count || 0),
    departments: Number(departments.rows[0]?.count || 0),
    products: Number(products.rows[0]?.count || 0),
    purchaseOrders: Number(purchaseOrders.rows[0]?.count || 0),
    purchaseTotal: Number(purchaseOrders.rows[0]?.total || 0),
    salesOrders: Number(salesOrders.rows[0]?.count || 0),
    salesTotal: Number(salesOrders.rows[0]?.total || 0),
    manufacturingOrders: Number(manufacturingOrders.rows[0]?.count || 0),
  };
}

// ============================================================================
// Employees
// ============================================================================

export async function getEmployees() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Employee_ID", "Name", "Contact", "Position", "Status", "Department"
    FROM "${BASE_ID}"."Employees"
    ORDER BY "Name" ASC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    employeeId: row.Employee_ID as string,
    Name: row.Name as string,
    contact: row.Contact as string,
    position: row.Position as string,
    status: row.Status as string,
    department: safeParseJson(row.Department)?.title || "",
  }));
}

export async function createEmployee(data: {
  Name: string;
  contact: string;
  position: string;
  status: string;
  departmentId?: string;
}) {
  return createRecord("tblcpTwSlhbUY3kOdUa", {
    fldDkD7tiSDTq5ByaEi: data.Name,
    fldNr8jHg1KFsbSacwM: data.contact,
    fldlueEnCp4q4Nbdhpr: data.position,
    fldu1LU731Q4lb4DwIb: data.status,
    ...(data.departmentId ? { fld7dL4SQkoBBSMzURZ: [data.departmentId] } : {}),
  });
}

export async function updateEmployee(id: string, data: {
  Name?: string;
  contact?: string;
  position?: string;
  status?: string;
  departmentId?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.Name !== undefined) fields.fldDkD7tiSDTq5ByaEi = data.Name;
  if (data.contact !== undefined) fields.fldNr8jHg1KFsbSacwM = data.contact;
  if (data.position !== undefined) fields.fldlueEnCp4q4Nbdhpr = data.position;
  if (data.status !== undefined) fields.fldu1LU731Q4lb4DwIb = data.status;
  if (data.departmentId !== undefined) fields.fld7dL4SQkoBBSMzURZ = data.departmentId ? [data.departmentId] : [];
  return updateRecord("tblcpTwSlhbUY3kOdUa", id, fields);
}

export async function deleteEmployee(id: string) {
  return deleteRecord("tblcpTwSlhbUY3kOdUa", id);
}

// ============================================================================
// Departments
// ============================================================================

export async function getDepartments() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Code", "Name", "Location", "Description", "Status", "Manager"
    FROM "${BASE_ID}"."Departments"
    ORDER BY "Name" ASC
    LIMIT 200
  `);
  return rows.map(row => ({
    id: row.__id as string,
    code: row.Code as string,
    Name: row.Name as string,
    location: row.Location as string,
    description: row.Description as string,
    status: row.Status as string,
    manager: safeParseJson(row.Manager)?.title || "",
  }));
}

export async function createDepartment(data: {
  code: string;
  Name: string;
  location: string;
  description: string;
  status: string;
}) {
  return createRecord("tblKPsfPodeEWRIvdm0", {
    fldqgkM5QlLGXM92bz8: data.code,
    fld04CDJaUI2vJJh56w: data.Name,
    fldxMEHcc1ENSpHyV0X: data.location,
    fldv6sVGecljuYGwXNL: data.description,
    fldX3RK91yfOtFS5z9X: data.status,
  });
}

export async function updateDepartment(id: string, data: {
  code?: string;
  Name?: string;
  location?: string;
  description?: string;
  status?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.code !== undefined) fields.fldqgkM5QlLGXM92bz8 = data.code;
  if (data.Name !== undefined) fields.fld04CDJaUI2vJJh56w = data.Name;
  if (data.location !== undefined) fields.fldxMEHcc1ENSpHyV0X = data.location;
  if (data.description !== undefined) fields.fldv6sVGecljuYGwXNL = data.description;
  if (data.status !== undefined) fields.fldX3RK91yfOtFS5z9X = data.status;
  return updateRecord("tblKPsfPodeEWRIvdm0", id, fields);
}

export async function deleteDepartment(id: string) {
  return deleteRecord("tblKPsfPodeEWRIvdm0", id);
}

// ============================================================================
// Products (Inventory)
// ============================================================================

export async function getProducts() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Label" AS "SKU", "name", "default_code", "standard_price" AS "Cost", "list_price" AS "Sale_Price", "qty_available" AS "Onhand", "barcode"
    FROM "${BASE_ID}"."Products"
    ORDER BY "id" ASC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    sku: row.SKU as string,
    Name: row.name as string,
    productCode: row.default_code as string,
    barcode: row.barcode as string,
    cost: Number(row.Cost || 0),
    salePrice: Number(row.Sale_Price || 0),
    onhand: Number(row.Onhand || 0),
    availableQty: Number(row.Available_Qty || 0),
    reorderPoint: Number(row.Reorder_Point || 0),
  }));
}
export interface HookLoopItem {
  id: string;
  label: string;
}

export async function getHookLoopItems(): Promise<HookLoopItem[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Name" FROM "${BASE_ID}"."Hook_Loop_Items" WHERE "Name" IS NOT NULL ORDER BY "Name" LIMIT 500`
  );
  return rows.map((row) => ({
    id: row.__id as string,
    label: row.Name as string,
  }));
}
export interface UnitOfMeasure {
  id: string;
  Name: string;
}

export async function getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Name" FROM "${BASE_ID}"."Units_of_Measure" WHERE "Name" IS NOT NULL ORDER BY "Name" LIMIT 100`
  );
  return rows.map((row) => ({
    id: row.__id as string,
    Name: row.Name as string,
  }));
}

export async function createProduct(data: {
  sku: string;
  Name: string;
  productCode: string;
  barcode?: string;
  cost: number;
  salePrice: number;
  reorderPoint: number;
}) {
  return createRecord(PRODUCT, {
    'Label': data.sku,
    'name': data.Name,
    'default_code': data.productCode,
    'barcode': data.barcode || "",
    'standard_price': data.cost,
    'list_price': data.salePrice,
    // 'reorder_point': data.reorderPoint,
  });
}

export async function updateProduct(id: string, data: {
  sku?: string;
  Name?: string;
  productCode?: string;
  barcode?: string;
  cost?: number;
  salePrice?: number;
  reorderPoint?: number;
}) {
  const fields: Record<string, unknown> = {};
  if (data.sku !== undefined) fields.fldfz6GEHVXAjg98KVL = data.sku;
  if (data.Name !== undefined) fields.fldrftRxilDx5PsR7uJ = data.Name;
  if (data.productCode !== undefined) fields.fldUUyPSjllgjlOR2tY = data.productCode;
  if (data.barcode !== undefined) fields.fld4nDtlEktYUrI02Ra = data.barcode;
  if (data.cost !== undefined) fields.fld0unz8xlhtFATLrq5 = data.cost;
  if (data.salePrice !== undefined) fields.fldgftVmi7HkWVqmRHE = data.salePrice;
  if (data.reorderPoint !== undefined) fields.fldQvMIBy9qDU87CM4q = data.reorderPoint;
  return updateRecord("tblSGof3jV6QLz5WkuN", id, fields);
}

export async function deleteProduct(id: string) {
  return deleteRecord("tblSGof3jV6QLz5WkuN", id);
}

export async function getStockOnHand() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Product", "Available_Quantity", "Reserved_Quantity", "Status", "Product", "Location"
    FROM "${BASE_ID}"."Stock_On_Hand"
    ORDER BY "ID" DESC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    Name: row.Product as string,
    qty: Number(row.Qty || 0),
    availableQty: Number(row.Available_Quantity || 0),
    reservedQty: Number(row.Reserved_Quantity || 0),
    status: row.Status as string,
    product: safeParseJson(row.Product)?.title || "",
    location: safeParseJson(row.Location)?.title || "",
  }));
}

export async function getStockMoves() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Quantity", "Date", "Status", "Source_Location", "Destination_Location", "Operation_Type"
    FROM "${BASE_ID}"."Stock_Move"
    ORDER BY "Date" DESC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    Name: row.Qty as string,
    date: row.Date as string,
    status: row.Status as string,
    batchNumber: row.Batch_Number as string,
    sourceLocation: safeParseJson(row.Source_Location)?.title || "",
    destinationLocation: safeParseJson(row.Destination_Location)?.title || "",
    operationType: safeParseJson(row.Operation_Type)?.title || "",
  }));
}

export async function getLocations() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Code", "Location_Name", "Status", "Warehouse"
    FROM "${BASE_ID}"."Locations"
    ORDER BY "ID" ASC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    code: row.Code as string,
    Name: row.Location_Name as string,
    status: row.Status as string,
    warehouse: safeParseJson(row.Warehouse)?.title || "",
  }));
}

export async function getWarehouses() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Name", "Company", "Status"
    FROM "${BASE_ID}"."Warehouse"
    ORDER BY "Name" ASC
    LIMIT 100
  `);
  return rows.map(row => ({
    id: row.__id as string,
    Name: row.Name as string,
    company: row.Company as string,
    status: row.Status as string,
  }));
}

// ============================================================================
// Purchase Orders
// ============================================================================

export async function getPurchaseOrders() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Order_Date", "Expected_Delivery", "Status", "Total_Amount", "Vendor"
    FROM "${BASE_ID}"."Purchase_Orders"
    ORDER BY "Order_Date" DESC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    reference: row.PO_Reference as string,
    orderDate: row.Order_Date as string,
    expectedDelivery: row.Expected_Delivery as string,
    status: row.Status as string,
    totalAmount: Number(row.Total_Amount || 0),
    vendor: safeParseJson(row.Vendor)?.title || "",
  }));
}

export async function createPurchaseOrder(data: {
  orderDate: string;
  expectedDelivery: string;
  status: string;
  vendorId?: string;
}) {
  return createRecord(PURCHASE_ORDERS_TABLE, {
    "Order_Date": data.orderDate,
    "Expected_Delivery": data.expectedDelivery,
    "Status": data.status,
    ...(data.vendorId ? { "Vendor": [data.vendorId] } : {}),
  });
}

export async function updatePurchaseOrder(id: string, data: {
  orderDate?: string;
  expectedDelivery?: string;
  status?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.orderDate !== undefined) fields["Order_Date"] = data.orderDate;
  if (data.expectedDelivery !== undefined) fields["Expected_Delivery"] = data.expectedDelivery;
  if (data.status !== undefined) fields["Status"] = data.status;
  return updateRecord(PURCHASE_ORDERS_TABLE, id, fields);
}

export async function deletePurchaseOrder(id: string) {
  return deleteRecord(PURCHASE_ORDERS_TABLE, id);
}

// ============================================================================
// Sales Orders
// ============================================================================

export async function getSalesOrders() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Name", "Order_Date", "Delivery_Date", "Status", "Total_Amount", "Customer"
    FROM "${BASE_ID}"."Sales_Orders"
    ORDER BY "Order_Date" DESC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    Name: row.Name as string,
    orderDate: row.Order_Date as string,
    deliveryDate: row.Delivery_Date as string,
    status: row.Status as string,
    totalAmount: Number(row.Total_Amount || 0),
    customer: safeParseJson(row.Customer)?.title || "",
  }));
}

export async function createSalesOrder(data: {
  orderDate: string;
  deliveryDate: string;
  status: string;
  customerId?: string;
}) {
  return createRecord(SALES_ORDERS_TABLE, {
    "Order_Date": data.orderDate,
    "Delivery_Date": data.deliveryDate,
    "Status": data.status,
    ...(data.customerId ? { "Customer": [data.customerId] } : {}),
  });
}

export async function updateSalesOrder(id: string, data: {
  orderDate?: string;
  deliveryDate?: string;
  status?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.orderDate !== undefined) fields["Order_Date"] = data.orderDate;
  if (data.deliveryDate !== undefined) fields["Delivery_Date"] = data.deliveryDate;
  if (data.status !== undefined) fields["Status"] = data.status;
  return updateRecord(SALES_ORDERS_TABLE, id, fields);
}

export async function deleteSalesOrder(id: string) {
  return deleteRecord(SALES_ORDERS_TABLE, id);
}

// ============================================================================
// Manufacturing Orders
// ============================================================================

export async function getManufacturingOrders() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Reference", "Date", "Start_Date", "End_Date", "Status", "Quantity", "Finished_Qty", "Finished_Goods", "BOM"
    FROM "${BASE_ID}"."MO"
    ORDER BY "Date" DESC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    reference: row.Reference as string,
    date: row.Date as string,
    startDate: row.Start_Date as string,
    endDate: row.End_Date as string,
    status: row.Status as string,
    quantity: Number(row.Quantity || 0),
    finishedQty: Number(row.Finished_Qty || 0),
    finishedProduct: safeParseJson(row.Finished_Product)?.title || "",
    bom: safeParseJson(row.BOM)?.title || "",
  }));
}

export async function createManufacturingOrder(data: {
  date: string;
  startDate: string;
  endDate: string;
  status: string;
  quantity: number;
  bomId?: string;
  productId?: string;
}) {
  return createRecord("tblPbvDgbuKgA55boy8", {
    fld8KDIMICVt1xz2lK5: data.date,
    fldL0wAAZUeCcuEavOz: data.startDate,
    fldEBTh6KseVZSBSxKS: data.endDate,
    fldmtKVIvDWxly1H2TL: data.status,
    fldol1eNL6A8B3OQDqe: data.quantity,
    ...(data.bomId ? { fldCeWMsBVDhk0cwc8n: [data.bomId] } : {}),
    ...(data.productId ? { fldjQTlqkyltfRmvzNl: [data.productId] } : {}),
  });
}

export async function updateManufacturingOrder(id: string, data: {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  quantity?: number;
}) {
  const fields: Record<string, unknown> = {};
  if (data.date !== undefined) fields.fld8KDIMICVt1xz2lK5 = data.date;
  if (data.startDate !== undefined) fields.fldL0wAAZUeCcuEavOz = data.startDate;
  if (data.endDate !== undefined) fields.fldEBTh6KseVZSBSxKS = data.endDate;
  if (data.status !== undefined) fields.fldmtKVIvDWxly1H2TL = data.status;
  if (data.quantity !== undefined) fields.fldol1eNL6A8B3OQDqe = data.quantity;
  return updateRecord("tblPbvDgbuKgA55boy8", id, fields);
}

export async function deleteManufacturingOrder(id: string) {
  return deleteRecord("tblPbvDgbuKgA55boy8", id);
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

// export async function createBOM(data: {
//   version: string;
//   quantity: number;
//   status: string;
//   effectiveDate: string;
//   reference: string;
// }) {
//   return createRecord("tbljVE4fCX1GxrlZOlO", {
//     fld0VdSDfuO9aUlG55s: data.version,
//     fldXoofJqfxsI38hfhd: data.quantity,
//     fldooU78f6gHZ362PtW: data.status,
//     fldSKhzNnNJqDWQDOlZ: data.effectiveDate,
//     fldV1cUu57SObBr8XId: data.reference,
//   });
// }

// export async function updateBOM(id: string, data: {
//   version?: string;
//   quantity?: number;
//   status?: string;
//   effectiveDate?: string;
//   reference?: string;
// }) {
//   const fields: Record<string, unknown> = {};
//   if (data.version !== undefined) fields.fld0VdSDfuO9aUlG55s = data.version;
//   if (data.quantity !== undefined) fields.fldXoofJqfxsI38hfhd = data.quantity;
//   if (data.status !== undefined) fields.fldooU78f6gHZ362PtW = data.status;
//   if (data.effectiveDate !== undefined) fields.fldSKhzNnNJqDWQDOlZ = data.effectiveDate;
//   if (data.reference !== undefined) fields.fldV1cUu57SObBr8XId = data.reference;
//   return updateRecord("tbljVE4fCX1GxrlZOlO", id, fields);
// }

export async function deleteBOM(id: string) {
  return deleteRecord("tbljVE4fCX1GxrlZOlO", id);
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

// ============================================================================
// Partners (Vendors/Customers)
// ============================================================================

export async function getPartners(type?: string) {
  let query = `
    SELECT "__id", "name", "email", "phone", "Type", "country", "property_payment_term_id", "Credit_Limit", "tax_id", "Website"
    FROM "${BASE_ID}"."Partners"
  `;
  if (type) {
    query += ` WHERE "Type" = '${type}'`;
  }
  query += ` ORDER BY "name" ASC LIMIT 500`;

  const { rows } = await sqlQuery(BASE_ID, query);
  return rows.map(row => ({
    id: row.__id as string,
    Name: row.name as string,
    email: row.Email as string,
    phone: row.Phone as string,
    type: row.Type as string,
    country: row.country as string,
    paymentTerms: row.property_payment_term_id as string,
    creditLimit: Number(row.Credit_Limit || 0),
    taxId: row.Tax_ID as string,
    website: row.Website as string,
  }));
}

export async function createPartner(data: {
  Name: string;
  email: string;
  phone: string;
  type: string;
  country: string;
  paymentTerms: string;
  creditLimit: number;
  taxId?: string;
  website?: string;
}) {
  return createRecord(PARTNERS_TABLE, {
    "Name": data.Name,
    "email": data.email,
    "phone": data.phone,
    "Type": data.type,
    "country": data.country,
    // "Payment_Terms": data.paymentTerms,
    // "Credit_Limit": data.creditLimit,
    "tax_id": data.taxId || "",
    // "Website": data.website || "",
  });
}

export async function updatePartner(id: string, data: {
  Name?: string;
  email?: string;
  phone?: string;
  type?: string;
  country?: string;
  paymentTerms?: string;
  creditLimit?: number;
  taxId?: string;
  website?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.Name !== undefined) fields["Name"] = data.Name;
  if (data.email !== undefined) fields["email"] = data.email;
  if (data.phone !== undefined) fields["phone"] = data.phone;
  if (data.type !== undefined) fields["type"] = data.type;
  if (data.country !== undefined) fields["country"] = data.country;
  if (data.paymentTerms !== undefined) fields["paymentTerms"] = data.paymentTerms;
  if (data.creditLimit !== undefined) fields["Credit_Limit"] = data.creditLimit;
  if (data.taxId !== undefined) fields["tax_id"] = data.taxId;
  if (data.website !== undefined) fields["Website"] = data.website;
  return updateRecord(PARTNERS_TABLE, id, fields);
}

export async function deletePartner(id: string) {
  return deleteRecord(PARTNERS_TABLE, id);
}

// ============================================================================
// Multi-Level BOM Explosion & Cost Calculations
// ============================================================================

export interface BOMLineItem {
  id: string;
  Name: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  level: number;
  parentBOMId?: string;
}

export interface BOMHierarchy {
  bomId: string;
  bomName: string;
  productName: string;
  totalCost: number;
  level: number;
  lines: BOMLineItem[];
  subBOMs?: BOMHierarchy[];
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
export async function getBOMsByProduct(productId: string) {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "BOM" as "Name", "Version" as "version", "Status" as "status", "Total_Material_Cost" as "total_cost"
    FROM "${BASE_ID}"."BOM"
    WHERE "__fk_fldcKWcxXFLKHBkqJxT" = '${productId}'
    ORDER BY "Version" DESC
    LIMIT 100
  `);

  return rows.map(row => ({
    id: row.__id as string,
    Name: row.Name as string,
    version: row.version as string,
    status: row.status as string,
    totalCost: Number(row.total_cost || 0),
  }));
}

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
export async function explodeBOM(bomId: string, quantity: number = 1, level: number = 0, visitedBOMs: Set<string> = new Set()): Promise<BOMLineItem[]> {
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

  const explodedItems: BOMLineItem[] = [];

  for (const row of rows) {
    const qtyForThisLevel = Number(row.qty_per_unit || 0) * quantity;
    const unitCost = Number(row.unit_cost || 0);

    explodedItems.push({
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

  return explodedItems;
}

/**
 * Create raw material lines for Manufacturing Order from BOM
 */
export async function createMORawMaterialsFromBOM(moId: string, bomId: string, moQuantity: number) {
  try {
    // Get exploded BOM items
    const explodedItems = await explodeBOM(bomId, moQuantity);

    // Get BOM lines to link them
    const { rows: bomLineRows } = await sqlQuery(BASE_ID, `
      SELECT "__id", "Product" as "product_json"
      FROM "${BASE_ID}"."BOM_Lines"
      WHERE "__fk_fldAxfVf6D1pCuq0oDh" = '${bomId}'
    `);

    // Create MO Raw Material records for each item
    const createdRecords = [];
    for (const item of explodedItems) {
      // Find matching BOM line
      const matchingBOMLine = bomLineRows.find(
        r => safeParseJson(r.product_json)?.id === item.productId
      );

      const record = await createRecord("tbl0aq09fCJXpdox9aT", {
        fldsokXZdzYBr5wKVvh: moId, // MO link
        fldFtiECtVOujmdbCiu: item.quantity, // Quantity
        fldIOQj0dOj3LgxOPVg: item.productId, // Product
        ...(matchingBOMLine ? { fldQwhRLMtk5G1pTtnP: matchingBOMLine.__id } : {}), // BOM Line
      });
      createdRecords.push(record);
    }

    return { success: true, count: createdRecords.length, records: createdRecords };
  } catch (error) {
    console.error("Error creating MO raw materials:", error);
    return { success: false, error: String(error), count: 0 };
  }
}

/**
 * Get all raw materials for a Manufacturing Order
 */
export async function getMORawMaterials(moId: string) {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT 
      mrm."__id" as "id",
      mrm."Quantity" as "quantity",
      mrm."Consume_Qty" as "consume_qty",
      p."__id" as "product_id",
      p."Name" as "product_Name",
      p."Unit_Cost" as "product_cost",
      bl."__id" as "bom_line_id",
      bl."Name" as "bom_line_Name"
    FROM "${BASE_ID}"."MO_Raw_Material" mrm
    LEFT JOIN "${BASE_ID}"."Products" p ON p."__id" = mrm."__fk_fldqRPhdzYBbKShNsEg"
    LEFT JOIN "${BASE_ID}"."BOM_Lines" bl ON bl."__id" = mrm."__fk_fldJTI7ub6KKVU0FrjM"
    WHERE mrm."__fk_fldsokXZdzYBr5wKVvh" = '${moId}'
    ORDER BY mrm."__id" DESC
    LIMIT 500
  `);

  return rows.map(row => ({
    id: row.id as string,
    quantity: Number(row.quantity || 0),
    consumeQty: Number(row.consume_qty || 0),
    productId: row.product_id as string,
    productName: row.product_Name as string,
    productCost: Number(row.product_cost || 0),
    bomLineId: row.bom_line_id as string || null,
    bomLineName: row.bom_line_Name as string,
  }));
}

/**
 * Calculate total raw material cost for a Manufacturing Order
 */
export async function calculateMORawMaterialCost(moId: string): Promise<number> {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT COALESCE(SUM(CAST("Quantity" AS numeric) * CAST("Unit_Cost" AS numeric)), 0) as "total"
    FROM "${BASE_ID}"."MO_Raw_Material" mrm
    LEFT JOIN "${BASE_ID}"."Products" p ON p."__id" = mrm."__fk_fldqRPhdzYBbKShNsEg"
    WHERE mrm."__fk_fldsokXZdzYBr5wKVvh" = '${moId}'
  `);

  return Number(rows[0]?.total || 0);
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

/**
 * Get manufacturing order with cost summary
 */
export async function getManufacturingOrderWithCosts(moId: string) {
  const [moQuery, rawMaterialCost] = await Promise.all([
    sqlQuery(BASE_ID, `
      SELECT 
        "__id", "MO_Reference", "Date", "Status", "Quantity", "Finished_Qty",
        "Product" as "product_json", "BOM" as "bom_json"
      FROM "${BASE_ID}"."MO"
      WHERE "__id" = '${moId}'
    `),
    calculateMORawMaterialCost(moId),
  ]);

  const moRow = moQuery.rows[0];
  if (!moRow) return null;

  return {
    id: moRow.__id as string,
    reference: moRow.MO_Reference as string,
    date: moRow.Date as string,
    status: moRow.Status as string,
    quantity: Number(moRow.Quantity || 0),
    finishedQty: Number(moRow.Finished_Qty || 0),
    productName: safeParseJson(moRow.product_json)?.title || "",
    bomName: safeParseJson(moRow.bom_json)?.title || "",
    rawMaterialCost: rawMaterialCost,
    costPerUnit: rawMaterialCost / (Number(moRow.Quantity || 1)),
  };
}
