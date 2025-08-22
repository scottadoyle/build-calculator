(function() {
    'use strict';

    // --- UI Updates ---
    // Functions responsible for updating the HTML display based on application state.
    const uiUpdater = {
        // Shows the main dashboard sections and populates initial values after file processing.
		initializeDashboardView: () => {
			utils.showElement(dom.dashboardControls);
			utils.showElement(dom.summaryCards);
			utils.showElement(dom.bomTableContainer);
			utils.showElement(dom.chartsSection);
			utils.showElement(dom.exportBtn);

			dom.buildableCount.textContent = utils.formatNumber(state.maxBuildable);
			// Use the new totalFutureBuildCapacity for the existing future capacity display
			dom.futureBuildableCount.textContent = utils.formatNumber(state.totalFutureBuildCapacity);
			dom.targetBuilds.max = Math.max(1, state.totalFutureBuildCapacity);
			dom.targetBuilds.value = 1;

			// Calculate and display total build capacity
			dom.totalBuildableCount.textContent = utils.formatNumber(state.totalBuildCapacity);

			uiUpdater.updateDashboardView();
		},

        // Main function to update the entire dashboard view based on current state and target build quantity.
        updateDashboardView: () => {
            // Get the current target build quantity from the input field.
            let target = utils.sanitizeInteger(dom.targetBuilds.value) || 1;

            const metrics = dataProcessor.calculateBuildMetrics(target);

            // Update summary cards
            dom.totalInventoryCost.textContent = utils.formatCurrency(metrics.totalInvCost);
            dom.openOrderCost.textContent = utils.formatCurrency(metrics.totalOrderCost);
            dom.additionalCost.textContent = utils.formatCurrency(metrics.totalAdditionalCost);
            dom.netAdditionalCost.textContent = utils.formatCurrency(metrics.totalNetAdditionalCost);
            // Display calculated metrics in the summary cards
            dom.totalBuildCost.textContent = utils.formatCurrency(metrics.totalBuildCostValue);

            // Update BOM table display with calculated values
            uiUpdater.updateBomTable(target, state.isFlatBom);

            // Update charts (debounced to prevent rapid redraws)
            chartManager.debouncedRenderCharts(target);

            
            // Calculate and display total build capacity
            dom.totalBuildableCount.textContent = utils.formatNumber(state.totalBuildCapacity);
        },
        // Clears and redraws the main BOM table based on filtered data and calculations.
        updateBomTable: (targetBuilds, isFlatBom = false) => {
            dom.bomTableBody.innerHTML = ''; // Clear existing rows

            let bomData = state.filteredData;

            if (isFlatBom) {
                bomData = dataProcessor.generateFlatBom(bomData);
                bomData.sort((a, b) => a.componentId.localeCompare(b.componentId));
            }

            bomData.forEach((item, index) => {
                const row = uiUpdater.createBomTableRow(item, targetBuilds, index, isFlatBom);
                dom.bomTableBody.appendChild(row);
            });

            uiUpdater.highlightLimitingComponents(targetBuilds);
        },

        // Creates the HTML string for a single row in the BOM table.
        createBomTableRow: (item, targetBuilds, index, isFlatBom = false) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

            const isSufficient = item.canBuild >= targetBuilds;
            const isFutureSufficient = item.futureBuild >= targetBuilds;
            const hasShortfall = item.shortfall > 0;
            const hasNetShortfall = item.netAdditionalQtyNeeded > 0;
            const needsOrder = item.orderQty > 0;
            const hasOrderCost = item.costToOrder > 0;

            // Add indentation based on BOM level
            const indentPixels = (item.bomLevel - 1) * 20;
            let bomLevelCell = '';
            if (!isFlatBom) {
                bomLevelCell = `<td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center">${item.bomLevel}</td>`;
            }
    let indentStyle = isFlatBom ? '' : `style="padding-left: ${indentPixels + 24}px;"`;
             row.innerHTML = `
                 <td class="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-left" ${indentStyle}>${utils.padLeadingZeros(item.componentId, 8)}</td>
                 ${isFlatBom ? '' : bomLevelCell}
                 <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center">${item.isMakePart ? 'Make' : 'Buy'}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500">${utils.truncateText(item.description, 30)}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${utils.formatNumber(item.qtyPerAssembly)}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${utils.formatNumber(item.onHand)}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${utils.formatNumber(item.onOrder)}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${item.itemCost.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm ${isSufficient ? 'text-green-600' : 'text-red-600'} text-right">${utils.formatNumber(item.canBuild)}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm ${isFutureSufficient ? 'text-green-600' : 'text-red-600'} text-right">${utils.formatNumber(item.futureBuild)}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm ${hasShortfall ? 'text-red-600 font-medium' : 'text-gray-500'} text-right">${hasShortfall ? utils.formatNumber(item.shortfall) : '-'}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm ${hasNetShortfall ? 'text-purple-600 font-medium' : 'text-gray-500'} text-right">${hasNetShortfall ? utils.formatNumber(item.netAdditionalQtyNeeded) : '-'}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${utils.formatNumber(item.minOrderQty)}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm ${needsOrder ? 'text-orange-600 font-medium' : 'text-gray-500'} text-right">${needsOrder ? utils.formatNumber(item.orderQty) : '-'}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm ${hasOrderCost && !item.isMakePart ? 'text-red-600 font-medium' : 'text-gray-500'} text-right">${(item.isMakePart ? '-' : (hasOrderCost ? utils.formatCurrency(item.costToOrder).split('.')[0] : '-'))}</td>
            `;
            return row;
        },

        // Applies a temporary highlight animation to rows representing limiting components (based on flat calculation).
        highlightLimitingComponents: (targetBuilds) => {
            const rows = dom.bomTableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const componentId = row.cells[0].textContent;
                const item = state.bomData.find(d => d.componentId === componentId);
                if (item && (item.canBuild < targetBuilds || item.futureBuild < targetBuilds)) {
                    row.classList.add('highlight');
                    // Remove highlight after animation
                    setTimeout(() => row.classList.remove('highlight'), 1500);
                }
            });
        },
        // Filters the displayed BOM data based on the search input and updates the table.
        filterBomTable: () => {
            const searchTerm = dom.searchBom.value.toLowerCase();
            const bomData = state.isFlatBom ? dataProcessor.generateFlatBom(state.bomData) : state.originalBomData;
            state.filteredData = bomData.filter(item => {
                const searchTermLower = searchTerm.toLowerCase();
                // Handle both padded and unpadded component IDs
                const componentId = item.componentId.toLowerCase();
                const paddedComponentId = utils.padLeadingZeros(componentId, 8).toLowerCase();

                const componentIdMatch = paddedComponentId.includes(searchTermLower) || componentId.includes(searchTermLower);
                const descriptionMatch = item.description.toLowerCase().includes(searchTermLower);
                const bomLevelMatch = String(item.bomLevel).includes(searchTermLower);

                return state.isFlatBom ? (componentIdMatch || descriptionMatch) : (componentIdMatch || descriptionMatch || bomLevelMatch);
            });
            const currentTarget = utils.sanitizeInteger(dom.targetBuilds.value);
            uiUpdater.updateBomTable(currentTarget, state.isFlatBom);
        },

        // Resets the UI elements to their initial state.
        // Shows a help popup with the provided text
        showHelpPopup: (text, targetElement) => {
            // Remove any existing popups
            const existingPopup = document.getElementById('helpPopup');
            if (existingPopup) {
                existingPopup.remove();
            }
            
            // Create popup element
            const popup = document.createElement('div');
            popup.id = 'helpPopup';
            popup.className = 'help-popup bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-md';
            
            // Add content
            popup.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-medium text-gray-900">${targetElement.parentElement.textContent.trim()}</h3>
                    <button id="closeHelpPopup" class="text-gray-400 hover:text-gray-500">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="text-sm text-gray-700">${text}</p>
            `;
            
            // Close popup on button click
            popup.querySelector('#closeHelpPopup').addEventListener('click', () => {
                popup.remove();
            });
            
            // Position the popup relative to the target element
            const rect = targetElement.getBoundingClientRect();
            popup.style.position = 'absolute';
            popup.style.top = `${rect.bottom + window.scrollY + 5}px`; // Position below the element
            popup.style.left = `${rect.left + window.scrollX}px`; // Align left edge
            
            // Add the popup to the document
            document.body.appendChild(popup);
        }
    };

    window.uiUpdater = uiUpdater; // Expose uiUpdater to the global scope for other modules

})();