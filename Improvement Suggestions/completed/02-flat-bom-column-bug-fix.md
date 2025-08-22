# Flat BOM Column Bug Fix

**Status:** Identified  
**Priority:** Medium  
**Category:** Bug Fix

---

## Problem Description
When viewing the **Flat BOM** and changing the build quantity, the table incorrectly adds back the BOM Level column in the data rows, even though:
- The header titles remain correct (no BOM Level column header)
- The user is still in Flat BOM mode
- To fix it, users must toggle to Indented BOM and back to Flat BOM

## Root Cause Analysis

### Issue Location
File: `uiUpdater.js`  
Function: `updateDashboardView()`  
Line: ~40

### The Bug
```javascript
// Current INCORRECT code in updateDashboardView()
uiUpdater.updateBomTable(target);  // Missing state.isFlatBom parameter
```

### Why It Happens
1. User is in Flat BOM mode (`state.isFlatBom = true`)
2. User changes build quantity
3. `updateDashboardView()` gets called
4. It calls `updateBomTable(target)` without passing the `isFlatBom` parameter
5. The function signature is `updateBomTable(targetBuilds, isFlatBom = false)`
6. Since no second parameter is passed, `isFlatBom` defaults to `false`
7. This causes the table to render as Indented BOM with BOM Level column

### Comparison with Working Code
The `filterBomTable()` function does this correctly:
```javascript
// CORRECT code in filterBomTable()
uiUpdater.updateBomTable(currentTarget, state.isFlatBom);  // ✅ Passes state.isFlatBom
```

## Proposed Fix

### Simple Solution
Change line ~40 in `updateDashboardView()` from:
```javascript
uiUpdater.updateBomTable(target);
```

To:
```javascript
uiUpdater.updateBomTable(target, state.isFlatBom);
```

### Complete Fix Code
```javascript
// Main function to update the entire dashboard view based on current state and target build quantity.
updateDashboardView: () => {
    // Get the current target build quantity from the input field.
    let target = utils.sanitizeInteger(dom.targetBuilds.value) || 1;

    const metrics = dataProcessor.calculateBuildMetrics(target);

    // Update summary cards
    dom.totalInventoryCost.textContent = utils.formatCurrency(metrics.totalInvCost);
    dom.openOrderCost.textContent = utils.formatCurrency(metrics.totalOrderCost);
    dom.additionalCost.textContent = utils.formatCurrency(metrics.totalAdditionalCost);
    dom.totalBuildCost.textContent = utils.formatCurrency(metrics.totalBuildCostValue);

    // Update BOM table display with calculated values
    uiUpdater.updateBomTable(target, state.isFlatBom);  // ← FIX: Add state.isFlatBom parameter

    // Update charts (debounced to prevent rapid redraws)
    chartManager.debouncedRenderCharts(target);

    // Calculate and display total build capacity
    dom.totalBuildableCount.textContent = utils.formatNumber(state.totalBuildCapacity);
},
```

## Impact
- **Low Risk**: Single line change with clear cause and effect
- **High User Benefit**: Eliminates confusing UI behavior
- **Consistency**: Makes `updateDashboardView()` consistent with `filterBomTable()`

## Testing Steps
1. Load BOM data
2. Switch to Flat BOM view
3. Verify no BOM Level column is shown
4. Change build quantity
5. Verify BOM Level column remains hidden
6. Verify all other calculations update correctly

---

*Last Updated: August 11, 2025*