(function() {
    'use strict';

    // --- Event Handlers ---
    // Attaches event listeners to DOM elements and defines their behavior.
    const eventHandlers = {
        // Sets up all event listeners for the application.
        setupEventListeners: () => {
            // File upload handling
            dom.fileUploadArea.addEventListener('click', () => dom.fileInput.click()); // Trigger file input on click
            dom.fileInput.addEventListener('change', fileHandler.handleUpload);
            dom.fileUploadArea.addEventListener('dragover', (e) => e.preventDefault()); // Prevent default to allow drop
            dom.fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                dom.fileInput.files = e.dataTransfer.files; // Assign dropped files to file input
                fileHandler.handleUpload();
            });

            // Target builds input validation and update
            dom.targetBuilds.addEventListener('input', () => {
                // Allow only positive integers
                dom.targetBuilds.value = dom.targetBuilds.value.replace(/[^0-9]/g, '');
            });
            dom.targetBuilds.addEventListener('input', () => {
                // Allow only positive integers
                dom.targetBuilds.value = dom.targetBuilds.value.replace(/[^0-9]/g, '');
                uiUpdater.updateDashboardView();
            });

            // BOM table filtering
            dom.searchBom.addEventListener('input', utils.debounce(uiUpdater.filterBomTable, 250));

            // Export functionality
            dom.exportBtn.addEventListener('click', eventHandlers.exportTableToCsv);

            // Reset functionality
            dom.resetBtn.addEventListener('click', eventHandlers.resetDashboard);

            // Help text popups
            // Dynamically attach event listeners to help icons
            document.addEventListener('dblclick', (event) => {
                if (event.target.classList.contains('help-icon')) {
                    const helpFor = event.target.dataset.helpKey;
                    const helpText = helpTexts[helpFor];
                    if (helpText) {
                        uiUpdater.showHelpPopup(helpText, event.target);
                    }
                }
            });

            // Close help popup when clicking outside the popup or icon
            document.addEventListener('click', (event) => {
                if (!event.target.classList.contains('help-icon')) {
                    const popup = document.getElementById('helpPopup');
                    if (popup && !popup.contains(event.target)) {
                        popup.remove();
                    }
                }
            });
        },

        // Exports the BOM table data to a CSV file.
        exportTableToCsv: () => {
            try {
                const csvRows = [];

                 // --- Add Checks ---
                if (!dom.bomTableHeader || dom.bomTableHeader.querySelectorAll('th').length === 0) {
                    utils.logError("Export Error: Table header not found or empty.");
                    utils.showAlert("Cannot export: Table header is missing or empty.");
                    return; // Stop if no headers
                }
                if (!dom.bomTableBody || dom.bomTableBody.querySelectorAll('tr').length === 0) {
                    utils.logError("Export Error: Table body not found or empty.");
                    utils.showAlert("Cannot export: No data rows in table.");
                    return; // Stop if no data rows
                }
                 // --- End Checks ---

                // Get headers from the table header element
            const headerCells = Array.from(dom.bomTableHeader.querySelectorAll('th'));
            // Filter out headers that are hidden (e.g., BOM Level in flat view)
            const visibleHeaders = headerCells.filter(th => th.style.display !== 'none');
            const numVisibleHeaders = visibleHeaders.length; // Count how many headers are actually visible

            const headers = visibleHeaders.map(header => {
                // Extract text, attempt to remove help icon text
                let text = header.textContent.trim();
                // A simple approach to remove potential icon text (assuming it's the last element)
                if (header.children.length > 0 && header.lastChild.nodeType === Node.ELEMENT_NODE) {
                   // Find the text node before the icon if possible
                   let textNode = header.firstChild;
                   while(textNode && textNode.nodeType !== Node.TEXT_NODE) {
                       textNode = textNode.nextSibling;
                   }
                   text = textNode ? textNode.textContent.trim() : text; // Fallback to full text if complex
                }
                 // Quote header and escape existing quotes
                return `"${text.replace(/"/g, '""')}"`;
            });
            csvRows.push(headers.join(','));

            // Get rows from the table body
            const rows = Array.from(dom.bomTableBody.querySelectorAll('tr'));
             if (rows.length === 0) { // Double check rows after getting them
                 utils.showAlert("No data rows found to export.");
                 return;
             }
            const rowData = rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                // Take only the first 'numVisibleHeaders' cells, matching the visible header count
                const cellsToExport = cells.slice(0, numVisibleHeaders);
                return cellsToExport.map(cell => {
                    let text = cell.textContent.trim();
                    // Escape double quotes and enclose in double quotes
                    return `"${text.replace(/"/g, '""')}"`;
                }).join(',');
            });
            csvRows.push(...rowData);

             // Check if we only have the header row
            if (csvRows.length <= 1) {
                utils.logInfo("Export Warning: No data rows to export.");
                utils.showAlert("No data rows available to export.");
                return; // Stop if only header exists
            }

            // Create CSV string
            const csvString = csvRows.join('\r\n'); // Correct line endings

            // Download the CSV file
            const a = document.createElement('a');
            a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvString);
            // a.target = '_blank'; // Remove target=_blank as it might interfere
            a.download = 'bom_data.csv';
            utils.logInfo("CSV download link created. Href:", a.href.substring(0, 100) + "..."); // Log start of href
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            utils.logInfo("CSV export initiated."); // Add log
            } catch (error) { // Add catch block
                utils.logError("Error during CSV export:", error);
                utils.showAlert("Failed to export CSV. Check console for details.");
            }
        },

        // Resets the dashboard to its initial state, clearing data and UI elements.
        resetDashboard: () => {
            utils.logInfo("Resetting dashboard...");
            try {
                // Clear data
                state.bomData = [];
                state.filteredData = [];
                state.maxBuildable = 0;
                state.maxFutureBuildable = 0;

                // Reset UI elements
                dom.fileName.textContent = '';
                dom.fileSize.textContent = '';
                utils.hideElement(dom.fileInfo);
                utils.hideElement(dom.dashboardControls);
                utils.hideElement(dom.summaryCards);
                utils.hideElement(dom.bomTableContainer);
                utils.hideElement(dom.chartsSection);
                utils.hideElement(dom.exportBtn);
                dom.bomTableBody.innerHTML = '';
                dom.buildableCount.textContent = '0';
                dom.futureBuildableCount.textContent = '0';
                dom.totalInventoryCost.textContent = '$0';
                dom.openOrderCost.textContent = '$0';
                dom.additionalCost.textContent = '$0';
                dom.totalBuildCost.textContent = '$0';
                dom.targetBuilds.value = '';
                utils.resetFileInput();

                // Destroy chart instances
                if (state.chartInstances.inventory) state.chartInstances.inventory.destroy();
                if (state.chartInstances.cost) state.chartInstances.cost.destroy();
                state.chartInstances = { inventory: null, cost: null };

                utils.logInfo("Dashboard reset successfully");
            } catch (error) {
                utils.logError("Error resetting dashboard:", error);
                utils.showAlert("Error resetting dashboard. Check the console for details.");
            }
        }
    };

    window.eventHandlers = eventHandlers; // Expose eventHandlers to the global scope for other modules

})();
