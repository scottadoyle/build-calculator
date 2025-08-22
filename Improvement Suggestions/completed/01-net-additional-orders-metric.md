# Net Additional Orders Needed Metric

**Status:** Proposed  
**Priority:** High  
**Category:** Feature Enhancement

---

## Problem Statement
The current "Additional Cost" calculation only considers inventory on hand (`onHand`) and ignores existing open orders (`onOrder`). This can lead to:
- Over-ordering components that are already on order
- Confusion about whether existing purchase orders will fulfill the build requirements
- Inefficient procurement decisions

## Current Behavior
```javascript
// Current calculation in dataProcessor.js
const netQtyToBuild = Math.max(0, grossRequirement - item.onHand);
```

This means if you need 65 units but have 60 on hand, it shows you need to order 5 more, even if you already have 100 units on order.

## Proposed Solution
Add a new "Net Additional Orders Needed" metric that considers both inventory and pending orders:

```javascript
// Proposed new calculation
const netQtyNeeded = Math.max(0, grossRequirement - (item.onHand + item.onOrder));
```

## Implementation Changes Required

### 1. Update `dataProcessor.js`
Add new calculation in `calculateBuildMetrics()`:
```javascript
// Add after existing shortfall calculation
item.netAdditionalQtyNeeded = Math.max(0, item.grossRequirement - (item.onHand + item.onOrder));
item.netAdditionalOrderQty = item.netAdditionalQtyNeeded > 0 ? 
    Math.ceil(item.netAdditionalQtyNeeded / item.minOrderQty) * item.minOrderQty : 0;
item.netAdditionalCost = item.netAdditionalOrderQty * item.itemCost;

// Add to return totals
let totalNetAdditionalCost = 0;
// In the forEach loop, add:
if (!item.isMakePart) {
    totalNetAdditionalCost += item.netAdditionalCost;
}
```

### 2. Update `index.html`
Add new summary card:
```html
<div class="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
    <div class="flex items-center justify-between">
        <div>
            <p class="text-sm font-medium text-purple-100">Net Additional Cost Needed</p>
            <p class="text-2xl font-bold" id="netAdditionalCost">$0</p>
            <p class="text-xs text-purple-200">After considering open orders</p>
        </div>
        <i class="fas fa-shopping-cart text-purple-200 text-3xl"></i>
    </div>
</div>
```

### 3. Update `uiUpdater.js`
Add new column to BOM table and update summary:
```javascript
// In updateDashboardView()
dom.netAdditionalCost.textContent = utils.formatCurrency(metrics.totalNetAdditionalCost);

// In createBomTableRow(), add new column:
<td class="px-6 py-3 whitespace-nowrap text-sm ${hasNetShortfall ? 'text-purple-600 font-medium' : 'text-gray-500'} text-right">
    ${hasNetShortfall ? utils.formatNumber(item.netAdditionalQtyNeeded) : '-'}
</td>
```

### 4. Update `dom.js`
Add new DOM reference:
```javascript
netAdditionalCost: document.getElementById('netAdditionalCost'),
```

## Benefits
- **More accurate procurement planning**: Shows true additional orders needed
- **Prevents over-ordering**: Accounts for components already on order
- **Better cash flow management**: Separates committed costs from truly additional costs
- **Clearer decision making**: Users can see if existing orders will fulfill requirements

## User Interface Enhancement
Display three cost metrics side by side:
1. **Additional Cost** (current logic) - "Cost ignoring open orders"  
2. **Open Order Cost** (existing) - "Money already committed"
3. **Net Additional Cost** (new) - "True additional orders needed"

This gives users complete visibility into their procurement situation.

---

*Last Updated: August 11, 2025*