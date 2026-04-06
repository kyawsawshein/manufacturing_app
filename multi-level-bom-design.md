# Multi-Level BOM Database Design

## Based on Current ERP System Schema

## 1. Current Schema Analysis

### Existing Tables:

1. **BOM** (`tbljVE4fCX1GxrlZOlO`)
   - Fields: Name, Version, Quantity, Status, Effective Date, Reference, Product, Total Material Cost
   - Links to: BOM Lines (one-to-many)

2. **BOM Lines** (`tblxWum7GLIpaEotAr4`)
   - Fields: Product, Quantity, Unit Cost, BOM Qty, UoM, Total Cost
   - Links to: BOM (many-to-one), Products (many-to-one)

3. **Products** (`tblPa6m5iZFnb2Yb7xu`)
   - Fields: Name, Category, Cost, Barcode, etc.

## 2. Multi-Level BOM Design Requirements

### Core Requirements:

1. Support hierarchical BOM structures (parent-child relationships)
2. Track BOM levels (Level 0 = finished product, Level 1 = sub-assemblies, etc.)
3. Support both "Make" (BOM) and "Buy" (Product) items
4. Calculate rolled-up costs through all levels
5. Support BOM explosion for material requirements planning
6. Handle circular reference prevention

## 3. Enhanced Schema Design

### Option 1: Minimal Changes (Recommended)

Add fields to existing tables to enable multi-level BOM without structural changes.

#### 3.1 Add to BOM Table (`tbljVE4fCX1GxrlZOlO`):

```json
{
  "id": "fldParentBOM",
  "Name": "Parent BOM",
  "type": "link",
  "options": {
    "relationship": "manyOne",
    "foreignTableId": "tbljVE4fCX1GxrlZOlO",
    "isOneWay": true,
    "lookupFieldId": "fldAFwbFX6fCWyIOMHl"
  }
},
{
  "id": "fldBOMLevel",
  "Name": "BOM Level",
  "type": "number",
  "options": {
    "formatting": {
      "type": "integer",
      "precision": 0
    }
  }
},
{
  "id": "fldIsAssembly",
  "Name": "Is Assembly",
  "type": "checkbox",
  "options": {}
},
{
  "id": "fldRolledUpCost",
  "Name": "Rolled Up Cost",
  "type": "formula",
  "options": {
    "expression": "IF({fldIsAssembly}, {fldTotalMaterialCost} + {fldLaborCost} + {fldOverheadCost}, {fldUnitCost})"
  }
}
```

#### 3.2 Add to BOM Lines Table (`tblxWum7GLIpaEotAr4`):

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
    "isOneWay": true,
    "lookupFieldId": "fldAFwbFX6fCWyIOMHl"
  }
},
{
  "id": "fldLineLevel",
  "Name": "Line Level",
  "type": "number",
  "options": {
    "formatting": {
      "type": "integer",
      "precision": 0
    }
  }
}
```

#### 3.3 Add to Products Table (`tblPa6m5iZFnb2Yb7xu`):

```json
{
  "id": "fldProductType",
  "Name": "Product Type",
  "type": "singleSelect",
  "options": ["Raw Material", "Sub-Assembly", "Finished Good", "Service", "Tooling"]
},
{
  "id": "fldDefaultBOM",
  "Name": "Default BOM",
  "type": "link",
  "options": {
    "relationship": "manyOne",
    "foreignTableId": "tbljVE4fCX1GxrlZOlO",
    "isOneWay": true,
    "lookupFieldId": "fldAFwbFX6fCWyIOMHl"
  }
}
```

### Option 2: New BOM Structure Table

Create a new table specifically for BOM hierarchy relationships.

#### 3.4 Create New Table: `BOM_Structure`

```json
{
  "id": "tblBOMStructure",
  "Name": "BOM Structure",
  "dbTableName": "\"bseTIY0IrZr61kt6u5E\".\"BOM_Structure\"",
  "fields": [
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
      "id": "fldChildItem",
      "Name": "Child Item",
      "type": "link",
      "options": {
        "relationship": "manyOne",
        "foreignTableId": "tblPa6m5iZFnb2Yb7xu",
        "lookupFieldId": "flduGdBbpGSguqFcckg"
      }
    },
    {
      "id": "fldChildBOM",
      "Name": "Child BOM",
      "type": "link",
      "options": {
        "relationship": "manyOne",
        "foreignTableId": "tbljVE4fCX1GxrlZOlO",
        "lookupFieldId": "fldAFwbFX6fCWyIOMHl"
      }
    },
    {
      "id": "fldQuantity",
      "Name": "Quantity",
      "type": "number",
      "options": {
        "formatting": {
          "precision": 4,
          "type": "decimal"
        }
      }
    },
    {
      "id": "fldLevel",
      "Name": "Level",
      "type": "number",
      "options": {
        "formatting": {
          "type": "integer",
          "precision": 0
        }
      }
    },
    {
      "id": "fldSequence",
      "Name": "Sequence",
      "type": "number",
      "options": {
        "formatting": {
          "type": "integer",
          "precision": 0
        }
      }
    },
    {
      "id": "fldEffectivityStart",
      "Name": "Effectivity Start",
      "type": "date",
      "options": {
        "formatting": {
          "date": "YYYY-MM-DD",
          "time": "None"
        }
      }
    },
    {
      "id": "fldEffectivityEnd",
      "Name": "Effectivity End",
      "type": "date",
      "options": {
        "formatting": {
          "date": "YYYY-MM-DD",
          "time": "None"
        }
      }
    }
  ]
}
```

## 4. Recommended Approach: Hybrid Solution

I recommend a hybrid approach that:

1. **Adds minimal fields to existing tables** (Option 1)
2. **Creates a new BOM Structure table** for complex hierarchies (Option 2)
3. **Maintains backward compatibility** with existing data

### 4.1 Enhanced BOM Lines with Hierarchy Support:

```
BOM Lines Table Enhancement:
- Keep existing Product link for "Buy" items
- Add Component BOM link for "Make" items
- Add Component Type field to distinguish between Product/BOM
- Add Line Level for hierarchy tracking
```

### 4.2 BOM Table Hierarchy Fields:

```
BOM Table Enhancement:
- Add Parent BOM link for top-level hierarchy
- Add BOM Level (0 for finished goods, 1+ for sub-assemblies)
- Add Is Assembly checkbox
- Add Rolled Up Cost formula
```

## 5. Data Model Relationships

```
Finished Good BOM (Level 0)
    ├── Sub-Assembly BOM A (Level 1)
    │   ├── Raw Material 1 (Product)
    │   ├── Raw Material 2 (Product)
    │   └── Sub-Sub-Assembly BOM (Level 2)
    │       ├── Raw Material 3 (Product)
    │       └── Raw Material 4 (Product)
    ├── Sub-Assembly BOM B (Level 1)
    │   ├── Raw Material 5 (Product)
    │   └── Purchased Part 1 (Product)
    └── Direct Material (Product)
```

## 6. Field Mappings for BOM Explosion

### 6.1 Component Resolution Logic:

```sql
-- Pseudo-SQL for BOM Explosion
WITH RECURSIVE bom_explosion AS (
  -- Anchor: Top-level BOM
  SELECT
    b.id as bom_id,
    b.Name as bom_Name,
    bl.product_id,
    bl.component_bom_id,
    bl.quantity,
    bl.line_level,
    0 as explosion_level,
    bl.quantity as total_quantity
  FROM bom_lines bl
  JOIN bom b ON bl.bom_id = b.id
  WHERE b.id = @top_bom_id

  UNION ALL

  -- Recursive: Drill into component BOMs
  SELECT
    cb.id as bom_id,
    cb.Name as bom_Name,
    cbl.product_id,
    cbl.component_bom_id,
    cbl.quantity,
    cbl.line_level,
    be.explosion_level + 1,
    be.total_quantity * cbl.quantity as total_quantity
  FROM bom_explosion be
  JOIN bom_lines cbl ON be.component_bom_id = cbl.bom_id
  JOIN bom cb ON cbl.bom_id = cb.id
  WHERE be.component_bom_id IS NOT NULL
)
SELECT * FROM bom_explosion
ORDER BY explosion_level, line_level;
```

## 7. Cost Roll-up Calculation

### 7.1 Roll-up Logic:

```
Level 2 Cost = Sum(Product Costs at Level 2)
Level 1 Cost = Sum(Product Costs at Level 1) + (Level 2 Cost * Quantity)
Level 0 Cost = Sum(Product Costs at Level 0) + (Level 1 Cost * Quantity) + Labor + Overhead
```

### 7.2 Implementation:

```javascript
// Pseudo-code for cost roll-up
function calculateBOMCost(bomId, level = 0) {
  const lines = getBOMLines(bomId);
  let totalCost = 0;

  for (const line of lines) {
    if (line.componentType === "Product") {
      totalCost += line.quantity * line.unitCost;
    } else if (line.componentType === "BOM") {
      const subBomCost = calculateBOMCost(line.componentBOMId, level + 1);
      totalCost += line.quantity * subBomCost;
    }
  }

  // Add level-specific costs
  if (level === 0) {
    totalCost += laborCost + overheadCost;
  }

  return totalCost;
}
```

## 8. Migration Strategy

### Phase 1: Schema Updates

1. Add new fields to existing tables (non-breaking)
2. Create new BOM Structure table
3. Update application code to use new fields

### Phase 2: Data Migration

1. Identify existing BOMs that should be multi-level
2. Convert flat BOMs to hierarchical structure
3. Calculate and populate BOM levels
4. Backfill rolled-up costs

### Phase 3: Validation & Testing

1. Verify BOM explosion results
2. Validate cost calculations
3. Test circular reference detection
4. Performance test with deep hierarchies

## 9. Implementation Priority

### High Priority (Core Multi-Level):

1. Add `Parent BOM` link to BOM table
2. Add `Component Type` and `Component BOM` to BOM Lines
3. Add `BOM Level` to both tables
4. Implement BOM explosion function

### Medium Priority (Enhanced Features):

1. Add `Product Type` to Products table
2. Create BOM Structure table for complex relationships
3. Implement cost roll-up calculations
4. Add effectivity dates for version control

### Low Priority (Advanced Features):

1. Phantom BOM support
2. Alternate component routing
3. BOM comparison and diff tools
4. Visual BOM hierarchy viewer

## 10. Sample Data Structure

### 10.1 BOM Table Record:

```json
{
  "id": "bom_001",
  "Name": "Finished Product XYZ",
  "parentBOM": null,
  "bomLevel": 0,
  "isAssembly": true,
  "quantity": 1,
  "status": "Active"
}
```

### 10.2 BOM Lines Record:

```json
{
  "id": "line_001",
  "bomId": "bom_001",
  "componentType": "BOM",
  "componentBOM": "bom_002",
  "product": null,
  "quantity": 2,
  "lineLevel": 1,
  "unitCost": 0 // Will be calculated from sub-BOM
}
```

## 11. Circular Reference Prevention

### 11.1 Validation Rules:

1. A BOM cannot reference itself directly
2. A BOM cannot reference any parent in its hierarchy
3. Maximum depth limit (e.g., 10 levels)
4. Real-time validation during BOM creation/update

### 11.2 Implementation:

```sql
-- Check for circular references
WITH RECURSIVE bom_hierarchy AS (
  SELECT id, parent_bom_id, 1 as depth
  FROM bom
  WHERE id = @bom_id

  UNION ALL

  SELECT b.id, b.parent_bom_id, bh.depth + 1
  FROM bom b
  JOIN bom_hierarchy bh ON b.id = bh.parent_bom_id
  WHERE bh.depth < 10  -- Prevent infinite recursion
)
SELECT COUNT(*) as circular_ref
FROM bom_hierarchy
WHERE id = @bom_id AND depth > 1;
```

## 12. Conclusion

This design provides a robust multi-level BOM solution that:

1. **Maintains backward compatibility** with existing data
2. **Supports complex hierarchies** through recursive relationships
3. **Enables accurate cost calculations** with roll-up logic
4. **Provides flexibility** for future enhancements
5. **Prevents common issues** like circular references

The hybrid approach (adding fields to existing tables + new structure table) offers the best balance of simplicity and functionality for your ERP system.
