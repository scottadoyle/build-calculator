(function() {
    'use strict';

    // --- DOM Element References ---
    // Caches references to frequently used DOM elements for performance.
    const dom = {
        // File input element
        fileInput: document.getElementById('fileInput'),
        // File information display element
        fileInfo: document.getElementById('fileInfo'),
        // File name display element
        fileName: document.getElementById('fileName'),
        // File size display element
        fileSize: document.getElementById('fileSize'),
        // Upload progress bar element
        uploadProgress: document.getElementById('uploadProgress'),
        // Dashboard controls section element
        dashboardControls: document.getElementById('dashboardControls'),
        // Summary cards section element
        summaryCards: document.getElementById('summaryCards'),
        // BOM table container element
        bomTableContainer: document.getElementById('bomTableContainer'),
        // BOM table header element (Added)
        bomTableHeader: document.getElementById('bomTableHeader'),
        // BOM table body element
        bomTableBody: document.getElementById('bomTableBody'),
        // Charts section element
        chartsSection: document.getElementById('chartsSection'),
        // Target builds input element
        targetBuilds: document.getElementById('targetBuilds'),
        // Buildable count display element
        buildableCount: document.getElementById('buildableCount'),
        // Future buildable count display element
        futureBuildableCount: document.getElementById('futureBuildableCount'),
        // Total inventory cost display element
        totalInventoryCost: document.getElementById('totalInventoryCost'),
        // Open order cost display element
        openOrderCost: document.getElementById('openOrderCost'),
        // Additional cost display element
        additionalCost: document.getElementById('additionalCost'),
        // Net additional cost display element
        netAdditionalCost: document.getElementById('netAdditionalCost'),
        // Total build cost display element
        totalBuildCost: document.getElementById('totalBuildCost'),
        // Search BOM input element
        searchBom: document.getElementById('searchBom'),
        // Export button element
        exportBtn: document.getElementById('exportBtn'),
        // Reset button element
        resetBtn: document.getElementById('resetBtn'),
        // File upload area element
        fileUploadArea: document.querySelector('.file-upload'),
        // Inventory chart canvas element
        inventoryChartCanvas: document.getElementById('inventoryChart'),
        // Cost chart canvas element
        costChartCanvas: document.getElementById('costChart'),
        // Total buildable count display element
        totalBuildableCount: document.getElementById('totalBuildableCount'),
        // Total future buildable count display element
        totalFutureBuildableCount: document.getElementById('totalFutureBuildableCount'),
        // Toggle BOM view button element
        toggleBomView: document.getElementById('toggleBomView')
    };

    window.dom = dom; // Expose dom to the global scope for other modules

})();
