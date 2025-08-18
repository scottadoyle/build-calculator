(function() {
    'use strict';

    // --- Help Text Definitions ---
    const helpTexts = {
        buildQty: "Enter the desired quantity of the final product you want to build.",
        buildCapacity: "Maximum number of products that can be built using only the current On-Hand inventory.",
        futureCapacity: "Maximum number of products that can be built considering the entire BOM hierarchy, including both On-Hand inventory and components currently On Order.",
        totalInventoryCost: "Total value of all components currently On Hand, calculated as (On Hand Qty * Unit Cost) for all components.",
        openOrderCost: "Total value of all components currently On Order, calculated as (On Order Qty * Unit Cost) for all components.",
        additionalCost: "Estimated additional cost required to order the necessary 'buy' components to meet the target Build Qty, based on calculated Order Qty and Unit Cost. Excludes costs for 'make' subassemblies.",
        totalBuildCost: "Estimated total cost of all components required for the target Build Qty, calculated using the hierarchical gross requirement and Unit Cost for every component, regardless of current inventory.",
        qtyPerParent: "The quantity of this component required to build one unit of its immediate parent assembly.",
        ohInventory: "The quantity of this component currently available in inventory.",
        onOrder: "The quantity of this component currently on open purchase orders.",
        unitCost: "The average cost per unit for this component.",
        canBuild: "The maximum number of top-level products that could theoretically be built using only the On-Hand quantity of *this specific component*, ignoring other constraints (Flat Calculation).",
        futureBuildTable: "The maximum number of top-level products that could theoretically be built using the On-Hand and On-Order quantity of *this specific component*, ignoring other constraints (Flat Calculation).",
        netQtyNeeded: "The calculated net quantity of this specific component needed to meet the target Build Qty, considering the requirements of its parent assembly and current On-Hand inventory.",
        orderQty: "The suggested quantity to order for this component, based on the Net Qty Needed and the component's Minimum Order Quantity (if available).",
        costToOrder: "The estimated cost to order the suggested 'Order Qty' for this component (Order Qty * Unit Cost). Shows '-' for 'make' parts as their cost is derived from subcomponents.",
        inventoryChart: "Shows the top 10 components with the lowest inventory availability percentage relative to the required quantity for the target build.",
        costChart: "Shows the top 5 components contributing the most to the Total Build Cost for the target quantity.",
        shortfallChart: "Summarizes component inventory status: Sufficient (enough on hand), On Order Covers (enough on hand + on order), or Shortfall (need to order).",
        totalBuildCapacity: "Maximum number of products that can be built considering the entire BOM hierarchy, using only On-Hand inventory. This combines the direct Build Capacity with additional capacity from remaining inventory.",
        totalFutureCapacity: "Maximum number of products that can be built considering the entire BOM hierarchy, including both On-Hand inventory and components currently On Order. This includes the current Total Build Capacity plus additional capacity gained from on-order parts."
    };

    window.helpTexts = helpTexts; // Expose helpTexts to the global scope for other modules

})();