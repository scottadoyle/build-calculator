// Wrap entire script in an IIFE (Immediately Invoked Function Expression)
// to avoid polluting the global scope and ensure 'use strict'.
(function() {
    'use strict';

    // Initialize the application
    const init = () => {
        // Set up event listeners
        eventHandlers.setupEventListeners();
        
        // Set the initial text content of the toggle BOM view button
        dom.toggleBomView.textContent = state.isFlatBom ? "Click for Indented BOM" : "Click for Flat BOM";
    };

    // Call init when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', init);
    
    
    // Add event listener to the toggle BOM view button
    dom.toggleBomView.addEventListener('click', () => {
        // Toggle the isFlatBom state
        state.isFlatBom = !state.isFlatBom;
        // Update the button text based on the current state
        if (state.isFlatBom) {
            dom.toggleBomView.textContent = "Click for Indented BOM";
        } else {
            dom.toggleBomView.textContent = "Click for Flat BOM";
        }

        let bomData = state.bomData;

        if (state.isFlatBom) {
            // Filter for buy parts (those without children)
            bomData = bomData.filter(item => !item.isMakePart);

            // Aggregate quantities
            const aggregatedData = {};
            bomData.forEach(item => {
                if (aggregatedData[item.componentId]) {
                    aggregatedData[item.componentId].qtyPerAssembly += item.qtyPerAssembly;
                } else {
                    aggregatedData[item.componentId] = { ...item };
                }
            });
            bomData = Object.values(aggregatedData).sort((a, b) => a.componentId.localeCompare(b.componentId));
        }

        const bomLevelHeader = document.getElementById('bomLevelHeader');
        if (bomLevelHeader) {
            bomLevelHeader.style.display = state.isFlatBom ? 'none' : '';
        }

        // Update the BOM table with the new data and isFlatBom state
        uiUpdater.updateBomTable(utils.sanitizeInteger(dom.targetBuilds.value) || 1, state.isFlatBom);
    });
})();