"use server";

import { sqlQuery, createRecord, updateRecord, deleteRecord, safeParseJson } from "@/lib/teable";

const BASE_ID = "bseTIY0IrZr61kt6u5E";

// ============================================================================
// Dashboard Stats
// ============================================================================

export async function getDashboardStats() {
  const [employees, departments, products, purchaseOrders, salesOrders, manufacturingOrders] = await Promise.all([
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count" FROM "bseTIY0IrZr61kt6u5E"."Employees" WHERE "Status" = 'Active'`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count" FROM "bseTIY0IrZr61kt6u5E"."Departments" WHERE "Status" = 'Active'`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count" FROM "bseTIY0IrZr61kt6u5E"."Products"`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count", COALESCE(SUM(CAST("Total_Amount" AS numeric)), 0) as "total" FROM "bseTIY0IrZr61kt6u5E"."Purchase_Orders" WHERE "Status" != 'Cancelled'`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count", COALESCE(SUM(CAST("Total_Amount" AS numeric)), 0) as "total" FROM "bseTIY0IrZr61kt6u5E"."Sales_Orders" WHERE "Status" != 'Cancelled'`),
    sqlQuery(BASE_ID, `SELECT COUNT(*) as "count" FROM "bseTIY0IrZr61kt6u5E"."MO" WHERE "Status" NOT IN ('Done', 'Cancel')`),
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
    FROM "bseTIY0IrZr61kt6u5E"."Employees"
    ORDER BY "Name" ASC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    employeeId: row.Employee_ID as string,
    name: row.Name as string,
    contact: row.Contact as string,
    position: row.Position as string,
    status: row.Status as string,
    department: safeParseJson(row.Department)?.title || "",
  }));
}

export async function createEmployee(data: {
  name: string;
  contact: string;
  position: string;
  status: string;
  departmentId?: string;
}) {
  return createRecord("tblcpTwSlhbUY3kOdUa", {
    fldDkD7tiSDTq5ByaEi: data.name,
    fldNr8jHg1KFsbSacwM: data.contact,
    fldlueEnCp4q4Nbdhpr: data.position,
    fldu1LU731Q4lb4DwIb: data.status,
    ...(data.departmentId ? { fld7dL4SQkoBBSMzURZ: [data.departmentId] } : {}),
  });
}

export async function updateEmployee(id: string, data: {
  name?: string;
  contact?: string;
  position?: string;
  status?: string;
  departmentId?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.name !== undefined) fields.fldDkD7tiSDTq5ByaEi = data.name;
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
    FROM "bseTIY0IrZr61kt6u5E"."Departments"
    ORDER BY "Name" ASC
    LIMIT 200
  `);
  return rows.map(row => ({
    id: row.__id as string,
    code: row.Code as string,
    name: row.Name as string,
    location: row.Location as string,
    description: row.Description as string,
    status: row.Status as string,
    manager: safeParseJson(row.Manager)?.title || "",
  }));
}

export async function createDepartment(data: {
  code: string;
  name: string;
  location: string;
  description: string;
  status: string;
}) {
  return createRecord("tblKPsfPodeEWRIvdm0", {
    fldqgkM5QlLGXM92bz8: data.code,
    fld04CDJaUI2vJJh56w: data.name,
    fldxMEHcc1ENSpHyV0X: data.location,
    fldv6sVGecljuYGwXNL: data.description,
    fldX3RK91yfOtFS5z9X: data.status,
  });
}

export async function updateDepartment(id: string, data: {
  code?: string;
  name?: string;
  location?: string;
  description?: string;
  status?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.code !== undefined) fields.fldqgkM5QlLGXM92bz8 = data.code;
  if (data.name !== undefined) fields.fld04CDJaUI2vJJh56w = data.name;
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
    SELECT "__id", "SKU", "Name", "Description", "Cost", "Sale_Price", "Onhand", "Available_Qty", "Reorder_Point", "Barcode"
    FROM "bseTIY0IrZr61kt6u5E"."Products"
    ORDER BY "Name" ASC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    sku: row.SKU as string,
    name: row.Name as string,
    productCode: row.Description as string,
    barcode: row.Barcode as string,
    cost: Number(row.Cost || 0),
    salePrice: Number(row.Sale_Price || 0),
    onhand: Number(row.Onhand || 0),
    availableQty: Number(row.Available_Qty || 0),
    reorderPoint: Number(row.Reorder_Point || 0),
  }));
}

export async function createProduct(data: {
  sku: string;
  name: string;
  productCode: string;
  barcode?: string;
  cost: number;
  salePrice: number;
  reorderPoint: number;
}) {
  return createRecord("tblSGof3jV6QLz5WkuN", {
    fldfz6GEHVXAjg98KVL: data.sku,
    fldrftRxilDx5PsR7uJ: data.name,
    fldUUyPSjllgjlOR2tY: data.productCode,
    fld4nDtlEktYUrI02Ra: data.barcode || "",
    fld0unz8xlhtFATLrq5: data.cost,
    fldgftVmi7HkWVqmRHE: data.salePrice,
    fldQvMIBy9qDU87CM4q: data.reorderPoint,
  });
}

export async function updateProduct(id: string, data: {
  sku?: string;
  name?: string;
  productCode?: string;
  barcode?: string;
  cost?: number;
  salePrice?: number;
  reorderPoint?: number;
}) {
  const fields: Record<string, unknown> = {};
  if (data.sku !== undefined) fields.fldfz6GEHVXAjg98KVL = data.sku;
  if (data.name !== undefined) fields.fldrftRxilDx5PsR7uJ = data.name;
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
    SELECT "__id", "Quantity", "Qty", "Available_Quantity", "Reserved_Quantity", "Status", "Product", "Location"
    FROM "bseTIY0IrZr61kt6u5E"."Inventory_Quantities"
    ORDER BY "Quantity" DESC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    name: row.Quantity as string,
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
    SELECT "__id", "Quantity", "Date", "Status", "Batch_Number", "Source_Location", "Destination_Location", "Operation_Type"
    FROM "bseTIY0IrZr61kt6u5E"."Stock_Movements"
    ORDER BY "Date" DESC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    name: row.Quantity as string,
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
    SELECT "__id", "Location_Code", "Location_Name", "Status", "Warehouse"
    FROM "bseTIY0IrZr61kt6u5E"."Locations_2"
    ORDER BY "Location_Code" ASC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    code: row.Location_Code as string,
    name: row.Location_Name as string,
    status: row.Status as string,
    warehouse: safeParseJson(row.Warehouse)?.title || "",
  }));
}

export async function getWarehouses() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Label", "Company", "Status"
    FROM "bseTIY0IrZr61kt6u5E"."New_tablewTapiN75XW"
    ORDER BY "Label" ASC
    LIMIT 100
  `);
  return rows.map(row => ({
    id: row.__id as string,
    name: row.Label as string,
    company: row.Company as string,
    status: row.Status as string,
  }));
}

// ============================================================================
// Purchase Orders
// ============================================================================

export async function getPurchaseOrders() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "PO_Reference", "Order_Date", "Expected_Delivery", "Status", "Total_Amount", "Vendor"
    FROM "bseTIY0IrZr61kt6u5E"."Purchase_Orders"
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
  return createRecord("tblcfnWU8Vb7dNtJEZo", {
    fldjUzQO0h5NVeg0WRw: data.orderDate,
    fldUbiCzmCzytWp0tql: data.expectedDelivery,
    fldn8PbkmTGKthr7yi1: data.status,
    ...(data.vendorId ? { fldAVHkTHmSW8YGh3Ch: [data.vendorId] } : {}),
  });
}

export async function updatePurchaseOrder(id: string, data: {
  orderDate?: string;
  expectedDelivery?: string;
  status?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.orderDate !== undefined) fields.fldjUzQO0h5NVeg0WRw = data.orderDate;
  if (data.expectedDelivery !== undefined) fields.fldUbiCzmCzytWp0tql = data.expectedDelivery;
  if (data.status !== undefined) fields.fldn8PbkmTGKthr7yi1 = data.status;
  return updateRecord("tblcfnWU8Vb7dNtJEZo", id, fields);
}

export async function deletePurchaseOrder(id: string) {
  return deleteRecord("tblcfnWU8Vb7dNtJEZo", id);
}

// ============================================================================
// Sales Orders
// ============================================================================

export async function getSalesOrders() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "Name", "Order_Date", "Delivery_Date", "Status", "Total_Amount", "Customer"
    FROM "bseTIY0IrZr61kt6u5E"."Sales_Orders"
    ORDER BY "Order_Date" DESC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    name: row.Name as string,
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
  return createRecord("tblcgaHqcge0NObcHGF", {
    fldXsIxa7eAgL9VuMXK: data.orderDate,
    fld47ona6fn0lPVXY3t: data.deliveryDate,
    fld5vmAcv2IhusCGyX5: data.status,
    ...(data.customerId ? { fldLQtTSQ23wo4MR4KY: [data.customerId] } : {}),
  });
}

export async function updateSalesOrder(id: string, data: {
  orderDate?: string;
  deliveryDate?: string;
  status?: string;
}) {
  const fields: Record<string, unknown> = {};
  if (data.orderDate !== undefined) fields.fldXsIxa7eAgL9VuMXK = data.orderDate;
  if (data.deliveryDate !== undefined) fields.fld47ona6fn0lPVXY3t = data.deliveryDate;
  if (data.status !== undefined) fields.fld5vmAcv2IhusCGyX5 = data.status;
  return updateRecord("tblcgaHqcge0NObcHGF", id, fields);
}

export async function deleteSalesOrder(id: string) {
  return deleteRecord("tblcgaHqcge0NObcHGF", id);
}

// ============================================================================
// Manufacturing Orders
// ============================================================================

export async function getManufacturingOrders() {
  const { rows } = await sqlQuery(BASE_ID, `
    SELECT "__id", "MO_Reference", "Date", "Start_Date", "End_Date", "Status", "Quantity", "Finished_Qty", "Finished_Product", "BOM"
    FROM "bseTIY0IrZr61kt6u5E"."MO"
    ORDER BY "Date" DESC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    reference: row.MO_Reference as string,
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
    FROM "bseTIY0IrZr61kt6u5E"."BOM_Headers"
    ORDER BY "BOM" ASC
    LIMIT 500
  `);
  return rows.map(row => ({
    id: row.__id as string,
    name: row.BOM as string,
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
  return createRecord("tbljVE4fCX1GxrlZOlO", {
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
  return updateRecord("tbljVE4fCX1GxrlZOlO", id, fields);
}

export async function deleteBOM(id: string) {
  return deleteRecord("tbljVE4fCX1GxrlZOlO", id);
}

// ============================================================================
// Partners (Vendors/Customers)
// ============================================================================

export async function getPartners(type?: string) {
  let query = `
    SELECT "__id", "Name", "Email", "Phone", "Type", "Country", "Payment_Terms", "Credit_Limit", "Tax_ID", "Website"
    FROM "bseTIY0IrZr61kt6u5E"."Partners"
  `;
  if (type) {
    query += ` WHERE "Type" = '${type}'`;
  }
  query += ` ORDER BY "Name" ASC LIMIT 500`;
  
  const { rows } = await sqlQuery(BASE_ID, query);
  return rows.map(row => ({
    id: row.__id as string,
    name: row.Name as string,
    email: row.Email as string,
    phone: row.Phone as string,
    type: row.Type as string,
    country: row.Country as string,
    paymentTerms: row.Payment_Terms as string,
    creditLimit: Number(row.Credit_Limit || 0),
    taxId: row.Tax_ID as string,
    website: row.Website as string,
  }));
}

export async function createPartner(data: {
  name: string;
  email: string;
  phone: string;
  type: string;
  country: string;
  paymentTerms: string;
  creditLimit: number;
  taxId?: string;
  website?: string;
}) {
  return createRecord("tblc9QUtlFwS3t1GJwn", {
    fldupiJvfHt1Ngee3c5: data.name,
    fldV8ZXuzPjIF5g4nSw: data.email,
    fldNwTApxN338Iu7uTh: data.phone,
    fldzJV0VtBgNqormk5W: data.type,
    fldVGCgqzwcEzdsk7gI: data.country,
    fldbgJNVsSWSjCIEE4y: data.paymentTerms,
    fldAMql7wEQbr3QHgbl: data.creditLimit,
    fldLFjY8yZe2Zi1BN39: data.taxId || "",
    fldMypa2FCSUWZr95Wh: data.website || "",
  });
}

export async function updatePartner(id: string, data: {
  name?: string;
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
  if (data.name !== undefined) fields.fldupiJvfHt1Ngee3c5 = data.name;
  if (data.email !== undefined) fields.fldV8ZXuzPjIF5g4nSw = data.email;
  if (data.phone !== undefined) fields.fldNwTApxN338Iu7uTh = data.phone;
  if (data.type !== undefined) fields.fldzJV0VtBgNqormk5W = data.type;
  if (data.country !== undefined) fields.fldVGCgqzwcEzdsk7gI = data.country;
  if (data.paymentTerms !== undefined) fields.fldbgJNVsSWSjCIEE4y = data.paymentTerms;
  if (data.creditLimit !== undefined) fields.fldAMql7wEQbr3QHgbl = data.creditLimit;
  if (data.taxId !== undefined) fields.fldLFjY8yZe2Zi1BN39 = data.taxId;
  if (data.website !== undefined) fields.fldMypa2FCSUWZr95Wh = data.website;
  return updateRecord("tblc9QUtlFwS3t1GJwn", id, fields);
}

export async function deletePartner(id: string) {
  return deleteRecord("tblc9QUtlFwS3t1GJwn", id);
}
