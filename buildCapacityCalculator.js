(function() {
    'use strict';

    // Calculates the total build capacity considering the BOM hierarchy.
    // Calculates the total build capacity considering the BOM hierarchy.
    function calculateTotalBuildCapacity(bomData, calculateMakePartCapacity) {
        // Find the top-level item (level 0)
        const topLevelItem = bomData.find(item => item.bomLevel === 0);

        // If there's no top-level item, return 0
        if (!topLevelItem) {
            return 0;
        }

        // Calculate the build capacity of the top-level item using the recursive function
        let totalCapacity = calculateMakePartCapacity(topLevelItem, bomData);

        return Math.floor(totalCapacity);
    }

    // Recursively calculates the build capacity of a make part based on its children.
    function calculateMakePartCapacity(parentItem, bomData) {
        let capacity = Infinity;
        // Find the children of the current item (BOM level one greater than the parent)
        const children = bomData.filter(item => item.bomLevel === parentItem.bomLevel + 1 && item.componentId.startsWith(parentItem.componentId));

        // If there are no children, the capacity is simply the onHand quantity of the parent
        if (children.length === 0) {
            return parentItem.onHand;
        }

        // Iterate through each child to determine the limiting component
        let minCapacity = Infinity;
        children.forEach(child => {
            let childCapacity = Infinity;

            // If the child is a make part, recursively calculate its capacity
            if (child.isMakePart) {
                childCapacity = calculateMakePartCapacity(child, bomData);
            } else {
                // If the child is a buy part, calculate how many parent items can be built from this child
                childCapacity = Math.floor(child.onHand / child.qtyPerAssembly);
            }

            // Check if parentItem.qtyPerAssembly is zero to avoid division by zero
            if (parentItem.qtyPerAssembly === 0) {
                return 0; // Or handle the case where there's no capacity
            }

            // Adjust child capacity based on the quantity per assembly
            childCapacity = childCapacity / parentItem.qtyPerAssembly;

            // The capacity of the parent is limited by the child with the smallest capacity
            minCapacity = Math.min(minCapacity, childCapacity);
        });

        return minCapacity;
    }

    // Expose the functions to the global scope
    window.buildCapacityCalculator = {
        // Calculates the total build capacity considering the BOM hierarchy.
        calculateTotalBuildCapacity: calculateTotalBuildCapacity,
        // Recursively calculates the build capacity of a make part based on its children.
        calculateMakePartCapacity: calculateMakePartCapacity
    };
})();