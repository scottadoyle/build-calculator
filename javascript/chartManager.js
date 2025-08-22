(function() {
    'use strict';

    // --- Chart Management ---
    // Manages the rendering and updating of charts using Chart.js.
    const chartManager = {
        // Debounced chart rendering to prevent performance issues with rapid updates.
        debouncedRenderCharts: utils.debounce((target) => {
            chartManager.renderCharts(target);
        }, 250),

        // Main function to render or update all charts.
        renderCharts: (targetBuilds) => {
            chartManager.renderInventoryChart(targetBuilds);
            chartManager.renderCostChart(targetBuilds);
            chartManager.renderShortfallChart();
        },

        // Renders the inventory chart showing components with the lowest inventory availability.
        renderInventoryChart: (targetBuilds) => {
            const ctx = dom.inventoryChartCanvas.getContext('2d');

            // Destroy existing chart instance if it exists
            if (state.chartInstances.inventory) {
                state.chartInstances.inventory.destroy();
            }

            const limitingComponents = state.bomData
                .sort((a, b) => (a.onHand / a.qtyPerAssembly) - (b.onHand / b.qtyPerAssembly))
                .slice(0, 10) // Top 10 limiting components
                .map(item => ({
                    label: item.componentId,
                    availablePercentage: (item.onHand / (item.qtyPerAssembly * targetBuilds)) * 100
                }));

            state.chartInstances.inventory = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: limitingComponents.map(item => item.label),
                    datasets: [{
                        label: 'Inventory Availability (%)',
                        data: limitingComponents.map(item => item.availablePercentage),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }]
                },
                options: chartManager.getBaseOptions('%')
            });
        },

        // Renders the cost chart showing components contributing the most to the total build cost.
        renderCostChart: (targetBuilds) => {
            const ctx = dom.costChartCanvas.getContext('2d');

            // Destroy existing chart instance if it exists
            if (state.chartInstances.cost) {
                state.chartInstances.cost.destroy();
            }
            
            // Ensure target builds is valid
            targetBuilds = parseInt(targetBuilds) || 1;
            
            // Debug info
            
            // Calculate component costs - use direct calculation instead of relying on grossRequirement
            const componentCosts = [];
            
            // Only process valid items
            state.bomData.forEach(item => {
                // Skip items with missing or invalid data
                if (!item || !item.componentId || !item.qtyPerAssembly || !item.itemCost) {
                    return;
                }
                
                // Calculate cost directly
                const qty = targetBuilds * item.qtyPerAssembly;
                const cost = qty * item.itemCost;
                
                // Log calculation for debugging
                
                // Only add valid costs
                if (isFinite(cost) && cost > 0) {
                    componentCosts.push({
                        label: item.componentId,
                        cost: cost
                    });
                }
            });
            
            // Sort by cost (highest first) and take top 5
            const topCosts = componentCosts
                .sort((a, b) => b.cost - a.cost)
                .slice(0, 5);
                
            
            // If no valid components, show placeholder data
            if (topCosts.length === 0) {
                topCosts.push({
                    label: 'No cost data available',
                    cost: 1
                });
            }

            // Create chart with valid data
            state.chartInstances.cost = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: topCosts.map(item => item.label),
                    datasets: [{
                        label: 'Component Cost',
                        data: topCosts.map(item => item.cost),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    return context.label + ': ' + new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        },

        // Renders the shortfall chart summarizing component inventory status.
        renderShortfallChart: () => {
            // Destroy existing chart instance if it exists
            if (state.chartInstances.shortfall) {
                state.chartInstances.shortfall.destroy();
            }
        },

        // Base options for all charts, including responsive design and tooltip customization.
        getBaseOptions: (prefix) => {
            const calculateTotal = (data) => {
                let total = 0;
                for (let i = 0; i < data.length; i++) {
                    total += data[i];
                }
                return total;
            };

            const baseOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';

                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    if (prefix === '$') {
                                        label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                    } else {
                                        label += context.parsed.y.toFixed(2) + (prefix || '');
                                    }
                                }
                                return [
                                    label,
                                ];
                            }
                        }
                    }
                }
            };

            return baseOptions;
        }
    };

    window.chartManager = chartManager; // Expose chartManager to the global scope for other modules

})();