# Teable Integration Guide

## ⚠️ Critical Rules

1. **Server Actions Only**: Wrap all Teable calls in `"use server"` functions
2. **SQL for Queries**: Use `sqlQuery()` with `dbTableName` and `dbFieldName` from schema
3. **Field IDs for Writes**: Use `fldXXX` IDs when creating/updating records
4. **Double Quotes**: All SQL identifiers must use double quotes: `"schema"."table"`

## Quick Start

```typescript
// Server Action
"use server";
import { sqlQuery, createRecord, signAttachments, safeParseJson } from '@/lib/teable';

// Query (use dbTableName/dbFieldName from schema)
export async function getUsers() {
  const { rows } = await sqlQuery('bseXXX', 
    `SELECT "__id", "fld_name", "fld_status" FROM "bseXXX"."tbl_users" WHERE "fld_status" = 'Active' LIMIT 100`
  );
  return rows;
}

// Aggregation
export async function getStats() {
  const { rows } = await sqlQuery('bseXXX',
    `SELECT COUNT(*) as "total", SUM(CAST("fld_amount" AS numeric)) as "sum" FROM "bseXXX"."tbl_orders"`
  );
  return rows[0];
}

// Create (use field IDs)
export async function addUser(name: string) {
  return createRecord('tblXXX', { fldName: name, fldStatus: 'Active' });
}
```

## SQL Reference

| Rule | Example |
|------|---------|
| Table name | `"bseXXX"."tbl_users"` (from `dbTableName`) |
| Field name | `"fld_name"` (from `dbFieldName`) |
| Record ID | `"__id"` |
| String value | `'Active'` (single quotes) |
| Always add | `LIMIT 100` for non-aggregate queries |

### Field Type → SQL

| Type | SQL Usage |
|------|-----------|
| text | `"fld_name" = 'value'` |
| number | `CAST("fld_amount" AS numeric)` for SUM/AVG |
| checkbox | `"fld_done" = true` |
| singleSelect | `"fld_status" = 'Active'` |
| multipleSelect | `"fld_tags" @> '["tag1"]'` |
| date | `"fld_date" > '2024-01-01'` |
| attachment | Parse JSON, use `signAttachments()` |

### Link Field (Important!)

Single-value links have **two columns**: JSON (`dbFieldName`) and FK (`options.foreignKeyName`).

| Type | JSON Column | FK Column |
|------|-------------|-----------|
| Single (ManyOne/OneOne) | `{"id":"recXXX","title":"..."}` | `"__fk_fldXXX"` = `recXXX` |
| Multi (OneMany/ManyMany) | `[{"id":".."},{}]` | N/A (use JSON) |

**⚠️ For single-value links, prefer FK column (more reliable):**

```sql
-- ✅ BEST: Use FK column for JOIN (find foreignKeyName in schema options)
SELECT t.*, p."fld_name" as "project_name"
FROM "bseXXX"."tbl_tasks" t
LEFT JOIN "bseXXX"."tbl_projects" p ON p."__id" = t."__fk_fldProject";

-- Group by linked record using FK
SELECT t."__fk_fldProject", p."fld_name", COUNT(*) as "count"
FROM "bseXXX"."tbl_tasks" t
LEFT JOIN "bseXXX"."tbl_projects" p ON p."__id" = t."__fk_fldProject"
GROUP BY 1, 2;

-- ⚠️ JSON extraction (may be null/malformed)
SELECT "fld_project"::jsonb->>'id' as "project_id" FROM "bseXXX"."tbl_tasks";
```

**Multi-value links (use JSON):**
```sql
SELECT * FROM "bseXXX"."tbl_projects" WHERE "fld_tasks"::jsonb @> '[{"id":"recXXX"}]';
SELECT "fld_name", jsonb_array_length("fld_tasks"::jsonb) as "count" FROM "bseXXX"."tbl_projects";
```

### User Field

User fields: `{ id, title, email? }`. Check `isMultipleCellValue` for single vs multi.

```sql
-- Single user
SELECT "fld_assignee"::jsonb->>'id' as "user_id", "fld_assignee"::jsonb->>'title' as "user_name"
FROM "bseXXX"."tbl_tasks";

-- Multi user: check contains
SELECT * FROM "bseXXX"."tbl_tasks" WHERE "fld_members"::jsonb @> '[{"id":"usrXXX"}]';
```

## Attachments

Batch ALL attachments in ONE request:

```typescript
const { rows } = await sqlQuery(baseId, `SELECT "__id", "fld_files" FROM "bseXXX"."tbl_docs" LIMIT 50`);

// Collect all attachments (use safeParseJson from above)
const all = rows.flatMap(row => {
  const files = safeParseJson(row.fld_files) || [];
  return files.map((f: any) => ({ ...f, rowId: row.__id }));
});

// Sign once
const signed = await signAttachments(baseId, all);
```

## Write Operations

Use field IDs (`fldXXX`), not `dbFieldName`:

```typescript
await createRecord('tblXXX', { fldName: 'Task', fldStatus: 'Pending' });
await updateRecord('tblXXX', 'recXXX', { fldStatus: 'Done' });
await deleteRecord('tblXXX', 'recXXX');
```

| Type | Format |
|------|--------|
| Text | `"value"` |
| Number | `123.45` |
| Checkbox | `true` / `false` |
| Date | `"2024-01-15T00:00:00.000Z"` |
| Select | `"Option"` or `["A", "B"]` |
| User/Link | `["usrXXX"]` / `["recXXX"]` |

## ⚠️ Common Mistakes

### 1. Wrong field name
```sql
-- ❌ SELECT "Access Key" FROM ...     (uses 'name' with spaces)
-- ✅ SELECT "Access_Key" FROM ...     (uses 'dbFieldName')
```

### 2. Missing quotes
```sql
-- ❌ SELECT fld_name FROM bseXXX.users
-- ✅ SELECT "fld_name" FROM "bseXXX"."users"
```

### 3. Reserved words (must quote)
`"Group"`, `"Order"`, `"User"`, `"Date"`, `"Name"`, `"Status"`, `"Type"`, `"Key"`

### 4. Alias without quotes
```sql
-- ❌ SELECT "Group" as group FROM ...
-- ✅ SELECT "Group" as "group_name" FROM ...
```

### 5. Quote rule
- **Double quotes** `"..."` → identifiers (tables, fields, aliases)
- **Single quotes** `'...'` → string values

### 6. JSON field parsing
JSON fields (User, Link, Attachment) may be string OR already-parsed object. Always use safe parse:

```typescript
function safeParseJson(value: unknown): any {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

// Usage
const user = safeParseJson(row.fld_assignee);
const attachments = safeParseJson(row.fld_files) || [];
```

## Schema Files

`schema/table-{id}.json` contains:
- `dbTableName`: Use in SQL (e.g., `"bseXXX"."tbl_xxx"`)
- `fields[].dbFieldName`: Column name for SQL
- `fields[].id`: Field ID for write operations
- `fields[].isMultipleCellValue`: true = multi-value (link/user)
- `fields[].options.foreignKeyName`: FK column for single-value link (e.g., `"__fk_fldXXX"`)

## Runtime

Keep `<ErrorReporter />` in `app/layout.tsx`.

## Teable Resources Context

### Current Teable Base

- Base ID: `bseTIY0IrZr61kt6u5E`
- Use this `baseId` for any API that requires a base identifier

### Teable Resources Schema

All Teable table schemas are stored as JSON files under the `schema/` directory of this project.

Available tables (id → name → schema file):

- `tblKJ9FLFv7o1A00O0W` → Production Cost Sheet → `schema/table-tblKJ9FLFv7o1A00O0W.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Production_Cost_Sheet"`)
- `tblD6VcQztuOI8X0HWa` → QC Checkpoints → `schema/table-tblD6VcQztuOI8X0HWa.json` (SQL: `"bseTIY0IrZr61kt6u5E"."QC_Checkpoints"`)
- `tblxKaRWqHZnbPNSIvO` → QC Orders → `schema/table-tblxKaRWqHZnbPNSIvO.json` (SQL: `"bseTIY0IrZr61kt6u5E"."QC_Orders"`)
- `tblPa6m5iZFnb2Yb7xu` → Products → `schema/table-tblPa6m5iZFnb2Yb7xu.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Product"`)
- `tblY0d2x7r6sB3dQa5j` → FG/PL/RBEX → `schema/table-tblY0d2x7r6sB3dQa5j.json` (SQL: `"bseTIY0IrZr61kt6u5E"."FG_PL_RBEX"`)
- `tblNhNRio3UNt9A6mOf` → Account Move Line → `schema/table-tblNhNRio3UNt9A6mOf.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Account_Move_Line"`)
- `tbl395okaO6le4iaR1x` → QC Results → `schema/table-tbl395okaO6le4iaR1x.json` (SQL: `"bseTIY0IrZr61kt6u5E"."QC_Results"`)
- `tblWVL9SWxiWGbidJTE` → Stock Lot → `schema/table-tblWVL9SWxiWGbidJTE.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Stock_Lot"`)
- `tblePU3ccRlF4Sv7Lpu` → Work In Progress (WIP) → `schema/table-tblePU3ccRlF4Sv7Lpu.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Work_In_Progress_WIP"`)
- `tbl7JIUHTMA3nCAAGIW` → Currencies → `schema/table-tbl7JIUHTMA3nCAAGIW.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Currencies"`)
- `tblN8PCHnjtPVgwYkx8` → Request Item → `schema/table-tblN8PCHnjtPVgwYkx8.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Request_Item"`)
- `tblxWum7GLIpaEotAr4` → BOM Lines → `schema/table-tblxWum7GLIpaEotAr4.json` (SQL: `"bseTIY0IrZr61kt6u5E"."BOM_Lines"`)
- `tblH6UTJxYtesnTyQhH` → MO Operations → `schema/table-tblH6UTJxYtesnTyQhH.json` (SQL: `"bseTIY0IrZr61kt6u5E"."MO_Operation"`)
- `tblg4ncr63WXpzbTG0J` → Companies → `schema/table-tblg4ncr63WXpzbTG0J.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Companies"`)
- `tblsIOQB6JF0uYOusXp` → Stock Valuation → `schema/table-tblsIOQB6JF0uYOusXp.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Stock_Valuation"`)
- `tblaFOdEAo9sqvAAmEZ` → PO Lines → `schema/table-tblaFOdEAo9sqvAAmEZ.json` (SQL: `"bseTIY0IrZr61kt6u5E"."New_table"`)
- `tblUzl4mPv3nA1ufAZl` → Cutting → `schema/table-tblUzl4mPv3nA1ufAZl.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Cutting"`)
- `tbl0aq09fCJXpdox9aT` → MO Raw Material → `schema/table-tbl0aq09fCJXpdox9aT.json` (SQL: `"bseTIY0IrZr61kt6u5E"."MO_Raw_Material"`)
- `tblRLVnYeavaHlqKA2s` → FG/PL/Production → `schema/table-tblRLVnYeavaHlqKA2s.json` (SQL: `"bseTIY0IrZr61kt6u5E"."FG_PL_Production"`)
- `tblgUXivhYFzqLRbghx` → Stock Move Lines → `schema/table-tblgUXivhYFzqLRbghx.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Stock_move_lines"`)
- `tblwTGHsdhgcsOJFAnt` → Work Stations → `schema/table-tblwTGHsdhgcsOJFAnt.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Work_Stations"`)
- `tbliEs1RFlkpMkbcJz7` → Cutting Line → `schema/table-tbliEs1RFlkpMkbcJz7.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Cutting_Line"`)
- `tblKPsfPodeEWRIvdm0` → Departments → `schema/table-tblKPsfPodeEWRIvdm0.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Departments"`)
- `tbljWYFNAedrd8YtB7P` → Product Categories → `schema/table-tbljWYFNAedrd8YtB7P.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Product_Categories"`)
- `tblc9QUtlFwS3t1GJwn` → Partners → `schema/table-tblc9QUtlFwS3t1GJwn.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Partners"`)
- `tblcpTwSlhbUY3kOdUa` → Employees → `schema/table-tblcpTwSlhbUY3kOdUa.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Employees"`)
- `tblnMBL9TZkU79CjnBf` → Product Templates → `schema/table-tblnMBL9TZkU79CjnBf.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Product_Templates"`)
- `tblFJkEGvmgLbINVAVx` → Stock Picking → `schema/table-tblFJkEGvmgLbINVAVx.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Stock_Picking"`)
- `tbltUsiaGfy6lqLcRtK` → Brands → `schema/table-tbltUsiaGfy6lqLcRtK.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Brands"`)
- `tblR11f69xiBigYee3f` → Cutting Hook & Loop → `schema/table-tblR11f69xiBigYee3f.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Cutting_Hook_Loop"`)
- `tbluyHoDZu7xyx4MId1` → Locations → `schema/table-tbluyHoDZu7xyx4MId1.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Locations"`)
- `tblyPSfKcaQIjDZRrCz` → Request MO → `schema/table-tblyPSfKcaQIjDZRrCz.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Request_MO"`)
- `tblbdeNRZvjEG4nH1rx` → Purchase Request → `schema/table-tblbdeNRZvjEG4nH1rx.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Purchase_Request"`)
- `tbld1ckQQ4Oq70n4hjn` → Customer PO → `schema/table-tbld1ckQQ4Oq70n4hjn.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Customer_PO"`)
- `tblgbzDmY8SzLdnMXxf` → Equipment → `schema/table-tblgbzDmY8SzLdnMXxf.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Equipment"`)
- `tblmvfBl1KNvB0ownLb` → Request RM → `schema/table-tblmvfBl1KNvB0ownLb.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Request_RM"`)
- `tblOvWu4NDW8YjP5XfZ` → Type → `schema/table-tblOvWu4NDW8YjP5XfZ.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Type"`)
- `tblgkA5H6JnZdavE6qL` → Hook & Loop Size → `schema/table-tblgkA5H6JnZdavE6qL.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Hook_Loop_Size"`)
- `tblVIyq3vYhpIzzOqDV` → Warehouse → `schema/table-tblVIyq3vYhpIzzOqDV.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Warehouse"`)
- `tblfNm28bPAW6I1A7Ki` → Quality Checks → `schema/table-tblfNm28bPAW6I1A7Ki.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Quality_Checks"`)
- `tblHkymCqhyNCw2F4O0` → Payment → `schema/table-tblHkymCqhyNCw2F4O0.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Payment"`)
- `tblWqzPZBg5mxvDAcEH` → Stock Move → `schema/table-tblWqzPZBg5mxvDAcEH.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Stock_Move"`)
- `tblo9esf4d7Agj5n4tn` → Journal → `schema/table-tblo9esf4d7Agj5n4tn.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Journal"`)
- `tblnT9f0vJAV63mFIQJ` → Model → `schema/table-tblnT9f0vJAV63mFIQJ.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Model"`)
- `tblg7lXl8YLJjv8bLJs` → Stock On Hand → `schema/table-tblg7lXl8YLJjv8bLJs.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Stock_On_Hand"`)
- `tblyMv9W9B6eKuuhmZI` → Taxes → `schema/table-tblyMv9W9B6eKuuhmZI.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Taxes"`)
- `tbl2hpVtax8DS5VEgg5` → Account Move → `schema/table-tbl2hpVtax8DS5VEgg5.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Account_Move"`)
- `tblCW0fvp4bBZ3SCuv2` → Hook & Loop Items → `schema/table-tblCW0fvp4bBZ3SCuv2.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Hook_Loop_Items"`)
- `tbl89A4Ps2lwrMui6vC` → Sales Order Lines → `schema/table-tbl89A4Ps2lwrMui6vC.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Sales_Order_Lines"`)
- `tblAvg4APx0CZ8zH2oY` → Chart of Account → `schema/table-tblAvg4APx0CZ8zH2oY.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Chart_of_Account"`)
- `tblPbvDgbuKgA55boy8` → MO  (Manufacturing Plan) → `schema/table-tblPbvDgbuKgA55boy8.json` (SQL: `"bseTIY0IrZr61kt6u5E"."MO"`)
- `tbluZE3J00gmOtjq719` → Purchase Order Lines → `schema/table-tbluZE3J00gmOtjq719.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Purchase_Order_Lines"`)
- `tblypkdG2CfrjsCglAY` → Units of Measure → `schema/table-tblypkdG2CfrjsCglAY.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Units_of_Measure"`)
- `tblMrcbHeLpBDnDF4PU` → Account Type → `schema/table-tblMrcbHeLpBDnDF4PU.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Account_Type"`)
- `tbl9oRDAAgDK4rwmfle` → Account Head → `schema/table-tbl9oRDAAgDK4rwmfle.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Account_Head"`)
- `tblmcOkAiv0jjGNDpCp` → Journal Type → `schema/table-tblmcOkAiv0jjGNDpCp.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Journal_Type"`)
- `tblSH8jYEl5d7tOFhZP` → Operation Type → `schema/table-tblSH8jYEl5d7tOFhZP.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Operation_Type"`)
- `tblcgaHqcge0NObcHGF` → Sales Orders → `schema/table-tblcgaHqcge0NObcHGF.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Sales_Orders"`)
- `tblCexjrKHvtp6azXpd` → Purchase Request Line → `schema/table-tblCexjrKHvtp6azXpd.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Purchase_Request_Line"`)
- `tblZgVg0b7Q36WLsKSy` → MO Finished Goods → `schema/table-tblZgVg0b7Q36WLsKSy.json` (SQL: `"bseTIY0IrZr61kt6u5E"."MO_Finished_Goods"`)
- `tbl8QlQ0FRRLSlKGu2w` → Request Cutting → `schema/table-tbl8QlQ0FRRLSlKGu2w.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Request_Cutting"`)
- `tblBYv84fvDjofLBVTA` → Product Type → `schema/table-tblBYv84fvDjofLBVTA.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Product_Types_Copy"`)
- `tblgmMIBt67GM05nSVF` → Location Types → `schema/table-tblgmMIBt67GM05nSVF.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Location_Types"`)
- `tblMwGQPqeDDgZcnh1h` → Cutting Tube → `schema/table-tblMwGQPqeDDgZcnh1h.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Cutting_Tube"`)
- `tbljVE4fCX1GxrlZOlO` → BOM → `schema/table-tbljVE4fCX1GxrlZOlO.json` (SQL: `"bseTIY0IrZr61kt6u5E"."BOM"`)
- `tblcfnWU8Vb7dNtJEZo` → Purchase Orders → `schema/table-tblcfnWU8Vb7dNtJEZo.json` (SQL: `"bseTIY0IrZr61kt6u5E"."Purchase_Orders"`)
