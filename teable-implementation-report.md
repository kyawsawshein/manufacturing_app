# Teable.ai Implementation Report

## Manufacturing Order Creation with Multi-Level BOM Support

## 1. Executive Summary

This report provides a complete implementation plan for enhancing the ERP System's Manufacturing Order (MO) creation workflow with multi-level BOM support. The solution enables:

- **MO Type Selection**: Production vs Cutting
- **BOM/Cutting Selection**: Based on MO type
- **Multi-Level BOM Explosion**: Automatic raw material line creation
- **Cost Calculations**: Raw material + Work center costs
- **Total Cost Aggregation**: Based on table schema

## 2. Current Schema Analysis

### 2.1 Key Tables Identified:

1. **MO (Manufacturing Plan)** - `tblPbvDgbuKgA55boy8`
   - Fields: Product, MO Type (Cutting/Production), Cutting BOM, Status, Quantity
   - Links: Product, Cutting BOM

2. **MO Raw Material** - `tbl0aq09fCJXpdox9aT`
   - Fields: MO, BOM Line, Product, Quantity, Consume Qty, Lot
   - Links: MO, BOM Line, Product

3. **BOM** - `tbljVE4fCX1GxrlZOlO`
   - Fields: Name, Version, Quantity, Status, Product, Total Material Cost

4. **BOM Lines** - `tblxWum7GLIpaEotAr4`
   - Fields: BOM, Product, Quantity, Unit Cost, Total Cost

5. **Cutting BOM** - `tblUzl4mPv3nA1ufAZl`
   - Fields: (Assumed similar to BOM but for cutting operations)

## 3. Enhanced Schema Requirements

### 3.1 Add to MO Table:

```json
{
  "id": "fldSelectedBOM",
  "Name": "Selected BOM",
  "type": "link",
  "options": {
    "relationship": "manyOne",
    "foreignTableId": "tbljVE4fCX1GxrlZOlO",
    "lookupFieldId": "fldAFwbFX6fCWyIOMHl"
  }
},
{
  "id": "fldMOLevel",
  "Name": "MO Level",
  "type": "number",
  "options": {
    "formatting": { "type": "integer", "precision": 0 }
  }
},
{
  "id": "fldTotalRawCost",
  "Name": "Total Raw Material Cost",
  "type": "rollup",
  "options": {
    "expression": "sum({values})",
    "formatting": { "type": "decimal", "precision": 2 }
  }
},
{
  "id": "fldTotalWorkCenterCost",
  "Name": "Total Work Center Cost",
  "type": "formula",
  "options": {
    "expression": "{fldLaborCost} + {fldMachineCost} + {fldOverheadCost}"
  }
}
```

### 3.2 Add to BOM Table (for Multi-Level Support):

```json
{
  "id": "fldParentBOM",
  "Name": "Parent BOM",
  "type": "link",
  "options": {
    "relationship": "manyOne",
    "foreignTableId": "tbljVE4fCX1GxrlZOlO",
    "lookupFieldId": "fldAFwbFX6fCWyIOMHl"
  }
},
{
  "id": "fldBOMLevel",
  "Name": "BOM Level",
  "type": "number",
  "options": {
    "formatting": { "type": "integer", "precision": 0 }
  }
},
{
  "id": "fldIsAssembly",
  "Name": "Is Assembly",
  "type": "checkbox",
  "options": {}
}
```

### 3.3 Add to BOM Lines Table:

```json
{
  "id": "fldComponentType",
  "Name": "Component Type",
  "type": "singleSelect",
  "options": ["Product", "BOM", "Phantom"]
},
{
  "id": "fldComponentBOM",
  "Name": "Component BOM",
  "type": "link",
  "options": {
    "relationship": "manyOne",
    "foreignTableId": "tbljVE4fCX1GxrlZOlO",
    "lookupFieldId": "fldAFwbFX6fCWyIOMHl"
  }
}
```

## 4. Manufacturing Order Creation Workflow

### 4.1 User Interface Flow:

```
1. User clicks "Create New Manufacturing Order"
2. Form appears with:
   - MO Type dropdown: [Production, Cutting]
   - Product selection (auto-filtered by type)
   - Quantity field
   - BOM selection (visible only if MO Type = Production)
   - Cutting selection (visible only if MO Type = Cutting)
   - Work Center selection
   - Planned Start/End dates
3. On BOM/Cutting selection:
   - System automatically explodes multi-level BOM
   - Shows preview of raw materials required
   - Calculates and displays cost breakdown
4. User confirms → System creates:
   - MO record
   - MO Raw Material lines (from BOM explosion)
   - Work center operations
```

### 4.2 Conditional Field Logic:

```javascript
// Teable Formula for conditional field visibility
IF(
  ({ MO_Type } = "Production"),
  SHOW_FIELD("Selected_BOM"),
  IF(({ MO_Type } = "Cutting"), SHOW_FIELD("Cutting_BOM"), HIDE_BOTH),
);
```

## 5. Multi-Level BOM Explosion Algorithm

### 5.1 BOM Explosion Function:

```javascript
/**
 * Explode multi-level BOM and create MO Raw Material lines
 * @param {string} bomId - Selected BOM ID
 * @param {number} moQuantity - MO quantity
 * @param {string} moId - Manufacturing Order ID
 * @returns {Array} Raw material requirements with quantities
 */
async function explodeBOM(bomId, moQuantity, moId) {
  const requirements = [];

  // Recursive function to traverse BOM hierarchy
  async function traverseBOM(currentBomId, level, parentQuantity = 1) {
    const bomLines = await getBOMLines(currentBomId);

    for (const line of bomLines) {
      if (line.componentType === "Product") {
        // Raw material - add to requirements
        requirements.push({
          productId: line.productId,
          bomLineId: line.id,
          quantity: line.quantity * parentQuantity * moQuantity,
          level: level,
          unitCost: line.unitCost,
          totalCost:
            line.quantity * parentQuantity * moQuantity * line.unitCost,
        });
      } else if (line.componentType === "BOM") {
        // Sub-assembly - recursively traverse
        await traverseBOM(
          line.componentBOMId,
          level + 1,
          parentQuantity * line.quantity,
        );
      }
    }
  }

  await traverseBOM(bomId, 0, 1);
  return requirements;
}
```

### 5.2 MO Raw Material Creation:

```javascript
/**
 * Create MO Raw Material records from exploded BOM
 * @param {Array} requirements - Exploded material requirements
 * @param {string} moId - Manufacturing Order ID
 */
async function createMORawMaterials(requirements, moId) {
  for (const req of requirements) {
    await createRecord("tbl0aq09fCJXpdox9aT", {
      fldsokXZdzYBr5wKVvh: [moId], // MO link
      fldQwhRLMtk5G1pTtnP: [req.bomLineId], // BOM Line link
      fldIOQj0dOj3LgxOPVg: [req.productId], // Product link
      fldFtiECtVOujmdbCiu: req.quantity, // Quantity
      fldObsX4bDLw7GCyKgn: req.quantity, // Consume Qty (same as quantity)
      // Additional fields as needed
    });
  }
}
```

## 6. Cost Calculation Functions

### 6.1 Raw Material Cost Calculation:

```javascript
/**
 * Calculate total raw material cost for MO
 * @param {string} moId - Manufacturing Order ID
 * @returns {number} Total raw material cost
 */
async function calculateRawMaterialCost(moId) {
  const { rows } = await sqlQuery(
    BASE_ID,
    `
    SELECT 
      SUM(rm."Quantity" * COALESCE(p."Cost", 0)) as total_cost
    FROM "bseTIY0IrZr61kt6u5E"."MO_Raw_Material" rm
    LEFT JOIN "bseTIY0IrZr61kt6u5E"."Product" p 
      ON rm."Product" = p."__id"
    WHERE rm."MO" = '${moId}'
  `,
  );

  return Number(rows[0]?.total_cost || 0);
}
```

### 6.2 Work Center Cost Calculation:

```javascript
/**
 * Calculate work center costs for MO
 * @param {string} moId - Manufacturing Order ID
 * @returns {Object} Cost breakdown
 */
async function calculateWorkCenterCost(moId) {
  const { rows } = await sqlQuery(
    BASE_ID,
    `
    SELECT 
      wc."Labor_Cost_Per_Hour",
      wc."Machine_Cost_Per_Hour",
      wc."Overhead_Rate",
      mo."Planned_Hours"
    FROM "bseTIY0IrZr61kt6u5E"."MO" mo
    LEFT JOIN "bseTIY0IrZr61kt6u5E"."Work_Centers" wc
      ON mo."Work_Center" = wc."__id"
    WHERE mo."__id" = '${moId}'
  `,
  );

  const data = rows[0];
  if (!data) return { labor: 0, machine: 0, overhead: 0, total: 0 };

  const laborCost = (data.Labor_Cost_Per_Hour || 0) * (data.Planned_Hours || 0);
  const machineCost =
    (data.Machine_Cost_Per_Hour || 0) * (data.Planned_Hours || 0);
  const overheadCost =
    ((laborCost + machineCost) * (data.Overhead_Rate || 0)) / 100;

  return {
    labor: laborCost,
    machine: machineCost,
    overhead: overheadCost,
    total: laborCost + machineCost + overheadCost,
  };
}
```

### 6.3 Total MO Cost Calculation:

```javascript
/**
 * Calculate total MO cost (raw materials + work center)
 * @param {string} moId - Manufacturing Order ID
 * @returns {Object} Complete cost breakdown
 */
async function calculateTotalMOCost(moId) {
  const [rawMaterialCost, workCenterCost] = await Promise.all([
    calculateRawMaterialCost(moId),
    calculateWorkCenterCost(moId),
  ]);

  return {
    rawMaterial: rawMaterialCost,
    workCenter: workCenterCost.total,
    labor: workCenterCost.labor,
    machine: workCenterCost.machine,
    overhead: workCenterCost.overhead,
    total: rawMaterialCost + workCenterCost.total,
  };
}
```

## 7. Teable.ai Implementation Steps

### 7.1 Step 1: Schema Enhancement

1. **Add new fields** to existing tables (as described in Section 3)
2. **Create new tables** if needed (Work Centers, Cost Rates)
3. **Set up field dependencies** for conditional visibility

### 7.2 Step 2: Formula Field Implementation

```javascript
// Example Teable formula for MO Total Cost
{
  Total_Raw_Material_Cost;
}
+{ Total_Work_Center_Cost };

// Example formula for BOM Level calculation
IF(ISBLANK({ Parent_BOM }), 0, LOOKUP({ Parent_BOM }, "BOM_Level") + 1);
```

### 7.3 Step 3: Automation Rules

Create Teable automations for:

1. **MO Creation Trigger**: When MO is created with BOM selected
2. **BOM Explosion**: Automatically create MO Raw Material lines
3. **Cost Calculation**: Update cost fields when quantities change
4. **Status Updates**: Change MO status based on progress

### 7.4 Step 4: View Configuration

Create optimized views:

1. **MO Creation View**: With conditional fields
2. **BOM Explorer View**: Hierarchical view of multi-level BOM
3. **Cost Analysis View**: Breakdown of MO costs
4. **Raw Material Requirements View**: Aggregated by product

## 8. User Interface Design

### 8.1 MO Creation Form:

```
┌─────────────────────────────────────┐
│ Manufacturing Order Creation        │
├─────────────────────────────────────┤
│ MO Type:    [Production] ▼          │
│ Product:    [Select Product] ▼      │
│ Quantity:   [_______]               │
│                                       │
│ ┌─ BOM Selection (visible if Production) ┐
│ │ Selected BOM: [Select BOM] ▼      │
│ │ BOM Version:  [1.0]              │
│ └───────────────────────────────────┘
│                                       │
│ ┌─ Cutting Selection (visible if Cutting)┐
│ │ Cutting BOM: [Select Cutting] ▼   │
│ │ Cutting Qty: [_______]            │
│ └───────────────────────────────────┘
│                                       │
│ Work Center: [Select Work Center] ▼  │
│ Start Date:  [YYYY-MM-DD]            │
│ End Date:    [YYYY-MM-DD]            │
│                                       │
│ ┌─ Cost Preview ────────────────────┐ │
│ │ Raw Materials:    $1,250.00       │ │
│ │ Labor:            $450.00         │ │
│ │ Machine:          $300.00         │ │
│ │ Overhead:         $150.00         │ │
│ │ Total Cost:       $2,150.00       │ │
│ └───────────────────────────────────┘ │
│                                       │
│ [Cancel]                     [Create] │
└─────────────────────────────────────┘
```

### 8.2 BOM Selection with Multi-Level Preview:

```
┌─────────────────────────────────────┐
│ Select BOM with Multi-Level View    │
├─────────────────────────────────────┤
│ Search: [_____________________]     │
│                                       │
│ ┌─ BOM Hierarchy ──────────────────┐ │
│ │ ◉ Finished Product XYZ (Level 0) │ │
│ │   ├─○ Sub-Assembly A (Level 1)   │ │
│ │   │  ├─ Raw Material 1 (10 units)│ │
│ │   │  └─ Raw Material 2 (5 units) │ │
│ │   ├─○ Sub-Assembly B (Level 1)   │ │
│ │   │  └─ Raw Material 3 (8 units) │ │
│ │   └─ Raw Material 4 (3 units)    │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Selected: Finished Product XYZ v1.2   │
│ Total Components: 4 raw materials     │
│ Estimated Cost: $1,250.00             │
│                                       │
│ [Cancel]                     [Select] │
└─────────────────────────────────────┘
```

## 9. Integration with Existing Workflow

### 9.1 Current MO Creation Process:

1. User creates MO manually
2. Manually adds raw material lines
3. Manually calculates costs
4. No multi-level BOM support

### 9.2 Enhanced Process:

1. **Intelligent MO Creation**: Auto-populates based on BOM selection
2. **Automatic Line Generation**: Creates MO Raw Material from BOM explosion
3. **Real-time Costing**: Calculates costs as user makes selections
4. **Multi-Level Support**: Handles complex BOM hierarchies

### 9.3 Backward Compatibility:

- Existing MOs remain unchanged
- New fields are optional (can be added gradually)
- Old BOMs work as single-level (Level 0)
- Gradual migration to multi-level structure

## 10. Testing Plan

### 10.1 Unit Tests:

1. **BOM Explosion Test**: Verify correct quantity calculations
2. **Cost Calculation Test**: Verify accurate cost aggregation
3. **Multi-Level Test**: Verify hierarchy traversal
4. **Conditional Field Test**: Verify field visibility based on MO type

### 10.2 Integration Tests:

1. **End-to-End MO Creation**: Create MO with multi-level BOM
2. **Cost Update Test**: Verify costs update when quantities change
3. **Work Center Integration**: Verify work center cost calculations
4. **Stock Impact Test**: Verify raw material requirements affect stock planning

### 10.3 Performance Tests:

1. **Deep BOM Hierarchy**: Test with 10+ level BOMs
2. **Large Quantity Scaling**: Test with high MO quantities
3. **Concurrent MO Creation**: Test multiple users creating MOs simultaneously

## 11. Deployment Strategy

### Phase 1: Schema Updates (Week 1)

- Add new fields to existing tables
- Create new tables if needed
- Set up field dependencies and formulas

### Phase 2: Function Development (Week 2-3)

- Develop BOM explosion algorithm
- Implement cost calculation functions
- Create automation rules

### Phase 3: UI Enhancement (Week 4)

- Update MO creation form
- Add BOM selection interface
- Implement cost preview

### Phase 4: Testing & Rollout (Week 5)

- Internal testing
- User acceptance testing
- Production deployment

## 12. Success Metrics

### 12.1 Quantitative Metrics:

- **MO Creation Time**: Reduce from 15 minutes to 2 minutes
- **Data Accuracy**: Increase from 85%
