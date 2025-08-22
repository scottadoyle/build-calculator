(function() {
    'use strict';

    // --- Application State ---
    // Stores the core data and status of the application.
    const state = {
        // Raw BOM data loaded from the CSV file
        bomData: [],
        // Filtered BOM data based on search term
        filteredData: [],
        // Maximum buildable quantity based on current inventory
        maxBuildable: 0,
  // Maximum buildable quantity based on future inventory (including on order)
        maxFutureBuildable: 0,
        // Chart.js instances for later destruction
        chartInstances: {
            inventory: null,
            cost: null,
            shortfall: null
        },
        // Flag indicating whether the Flat BOM view is active
        isFlatBom: false,
        // Flag to prevent multiple processInitialData calls that corrupt BOM array order
        isDataProcessed: false
    };

    window.state = state; // Expose state to the global scope for other modules

})();