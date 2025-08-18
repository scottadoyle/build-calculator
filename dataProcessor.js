(function() {
    'use strict';

    // --- Data Processing & Calculations ---
    // Handles calculations based on the parsed BOM data and user input.
    const dataProcessor = {
        // Performs initial data processing steps after CSV parsing is complete.
        processInitialData: () => {
            utils.logInfo("Processing BOM data...");
            try {
                // Helper function to parse numbers with thousand separators
                function parseNumber(value) {
                    if (typeof value === 'string') {
                        return parseFloat(value.replace(/,/g, ''));
                    }
                    return parseFloat(value);
                }
        
                state.bomData = state.bomData.filter(item => item.qtyPerAssembly > 0);
                state.bomData.forEach((item, index) => {
                    // Parse qtyPerAssembly and itemCost using the helper function
                    item.qtyPerAssembly = parseNumber(item.qtyPerAssembly);
                    item.itemCost = parseNumber(item.itemCost);
        
                    dataProcessor.calculateBaseItemMetrics(item);
                    item.isMakePart = false;
                    item.totalQty = item.qtyPerAssembly;
                    item.id = index; // Add an incrementing ID
                });
                dataProcessor.calculateOverallMetrics();
                dataProcessor.determineMakeBuyStatus(); // Add make/buy flag
                state.originalBomData = [...state.bomData]; // Store original data
                state.filteredData = [...state.bomData]; // Initialize filtered data
                state.totalBuildCapacity = dataProcessor.calculateTotalBuildCapacity(state.bomData); // Calculate total build capacity
                state.totalFutureBuildCapacity = dataProcessor.calculateTotalFutureBuildCapacity(state.bomData); // Calculate total future build capacity
                utils.logInfo("BOM data processed successfully");
            } catch (error) {
                utils.logError("Error in processInitialData:", error);
                utils.showAlert("There was an error processing the BOM data. Check the console for details.");
            }
        },

        // Calculates initial metrics for a single BOM item (like flat buildable quantities).
        calculateBaseItemMetrics: (item) => {
            // Ensure required properties exist and are numbers
            item.qtyPerAssembly = item.qtyPerAssembly || 0;
            item.onHand = item.onHand || 0;
            item.onOrder = item.onOrder || 0;
            item.itemCost = item.itemCost || 0;
            item.minOrderQty = item.minOrderQty || 1;

            // Calculate buildable quantities based on current inventory
            item.canBuild = item.qtyPerAssembly > 0 ? Math.floor(item.onHand / item.qtyPerAssembly) : 0;
            item.futureBuild = item.qtyPerAssembly > 0 ? Math.floor((item.onHand + item.onOrder) / item.qtyPerAssembly) : 0;
        },

        // Calculates the overall maximum buildable quantities based on flat (non-hierarchical) inventory.
        calculateOverallMetrics: () => {
            // Filter for level 1 components
            const levelOneComponents = state.bomData.filter(item => item.bomLevel === 1);
            const canBuildValues = levelOneComponents.map(item => item.canBuild).filter(val => !isNaN(val) && isFinite(val));
            const futureBuildValues = levelOneComponents.map(item => item.futureBuild).filter(val => !isNaN(val) && isFinite(val));

            state.maxBuildable = canBuildValues.length > 0 ? Math.min(...canBuildValues) : 0;
            state.maxFutureBuildable = futureBuildValues.length > 0 ? Math.min(...futureBuildValues) : 0;
        },

        // Calculates detailed metrics for each BOM item based on the target build quantity,
        // considering the indented BOM hierarchy.
        calculateBuildMetrics: (targetBuilds) => {
            let totalInvCost = 0;
            let totalOrderCost = 0;
            let totalAdditionalCost = 0;
            let totalBuildCostValue = 0;

            const parentNetQtyNeeded = { 0: targetBuilds };

            state.bomData.forEach(item => {
                const currentLevel = item.bomLevel;
                const parentLevel = currentLevel - 1;

                const parentRequirement = parentNetQtyNeeded[parentLevel] || 0;
                const grossRequirement = parentRequirement * item.qtyPerAssembly;
                const netQtyToBuild = Math.max(0, grossRequirement - item.onHand);

                parentNetQtyNeeded[currentLevel] = netQtyToBuild;

                item.grossRequirement = grossRequirement;
                item.shortfall = netQtyToBuild;

                if (item.shortfall > 0) {
                    item.orderQty = Math.ceil(item.shortfall / item.minOrderQty) * item.minOrderQty;
                } else {
                    item.orderQty = 0;
                }

                item.costToOrder = item.orderQty * item.itemCost;

                totalInvCost += (item.onHand * item.itemCost);
                totalOrderCost += (item.onOrder * item.itemCost);
                if (!item.isMakePart) {
                    totalAdditionalCost += item.costToOrder;
                }
                totalBuildCostValue += (item.grossRequirement * item.itemCost);
            });

            dataProcessor.calculateOverallMetricsHierarchical();

            return {
                totalInvCost,
                totalOrderCost,
                totalAdditionalCost,
                totalBuildCostValue
            };
        },

        calculateOverallMetricsHierarchical: () => {
            dataProcessor.calculateOverallMetrics();
        },

        determineMakeBuyStatus: () => {
            for (let i = 1; i < state.bomData.length; i++) {
                const currentItem = state.bomData[i];
                const precedingItem = state.bomData[i - 1];

                // If the current item's BOM level is higher than the preceding item's,
                // then the preceding item is a make part
                if (currentItem.bomLevel > precedingItem.bomLevel) {
                    precedingItem.isMakePart = true;
                }
            }
        },

        calculateBuildableQuantity: (item) => {
            return item.canBuild;
        },

        calculateTotalBuildCapacity: (bomData) => {
            // 1. Calculate build capacity from level 1 components
            let buildCapacity = 0;
            const level1Components = bomData.filter(item => item.bomLevel === 1);
            
            if (level1Components.length > 0) {
                const buildableQtys = level1Components
                    .filter(item => item.qtyPerAssembly > 0)
                    .map(item => Math.floor(item.onHand / item.qtyPerAssembly));
                
                buildCapacity = buildableQtys.length > 0 ? Math.min(...buildableQtys) : 0;
            }
            
            // 2. Track component usage for buildCapacity
            const usedInventory = {};
            level1Components.forEach(item => {
                usedInventory[item.componentId] = buildCapacity * item.qtyPerAssembly;
            });
            
            // 3. Create a flat BOM of only buy parts with remaining inventory
            const buyComponents = [];
            
            bomData.forEach(item => {
                // Skip make parts and items with zero/negative quantity
                if (item.isMakePart || item.qtyPerAssembly <= 0) {
                    return;
                }
                
                // Create a copy with remaining inventory
                const remainingItem = { ...item };
                
                // Subtract used inventory if any
                if (usedInventory[item.componentId]) {
                    remainingItem.onHand = Math.max(0, item.onHand - usedInventory[item.componentId]);
                }
                
                // Only add if there's inventory remaining
                if (remainingItem.onHand > 0) {
                    buyComponents.push(remainingItem);
                }
            });
            
            // 4. Aggregate quantities for components that appear multiple times
            const flatBomMap = {};
            buyComponents.forEach(item => {
                if (!flatBomMap[item.componentId]) {
                    flatBomMap[item.componentId] = { ...item };
                } else {
                    // Add quantities together but keep original onHand
                    flatBomMap[item.componentId].qtyPerAssembly += item.qtyPerAssembly;
                }
            });
            
            const flatBom = Object.values(flatBomMap);
            
            // 5. Calculate additional buildable quantity
            let additionalBuildable = 0;
            
            if (flatBom.length > 0) {
                const additionalQtys = flatBom.map(item => 
                    Math.floor(item.onHand / item.qtyPerAssembly)
                );
                
                additionalBuildable = additionalQtys.length > 0 ? Math.min(...additionalQtys) : 0;
            }
            
            // 6. Calculate total build capacity
            const totalBuildCapacity = buildCapacity + additionalBuildable;
            
            return totalBuildCapacity;
        },

        calculateTotalFutureBuildCapacity: (bomData) => {
            // 1. Calculate future build capacity from level 1 components (including on-order)
            let futureBuildCapacity = 0;
            const level1Components = bomData.filter(item => item.bomLevel === 1);
            
            if (level1Components.length > 0) {
                const futureBuildableQtys = level1Components
                    .filter(item => item.qtyPerAssembly > 0)
                    .map(item => Math.floor((item.onHand + item.onOrder) / item.qtyPerAssembly));
                
                futureBuildCapacity = futureBuildableQtys.length > 0 ? Math.min(...futureBuildableQtys) : 0;
            }
            
            // 2. Track component usage for futureBuildCapacity
            const usedInventory = {};
            level1Components.forEach(item => {
                usedInventory[item.componentId] = futureBuildCapacity * item.qtyPerAssembly;
            });
            
            // 3. Create a flat BOM of only buy parts with remaining inventory (including on-order)
            const buyComponents = [];
            
            bomData.forEach(item => {
                // Skip make parts and items with zero/negative quantity
                if (item.isMakePart || item.qtyPerAssembly <= 0) {
                    return;
                }
                
                // Create a copy with remaining inventory (including on-order)
                const remainingItem = { ...item };
                const totalInventory = item.onHand + item.onOrder;
                
                // Subtract used inventory if any
                if (usedInventory[item.componentId]) {
                    remainingItem.totalInventory = Math.max(0, totalInventory - usedInventory[item.componentId]);
                } else {
                    remainingItem.totalInventory = totalInventory;
                }
                
                // Only add if there's inventory remaining
                if (remainingItem.totalInventory > 0) {
                    buyComponents.push(remainingItem);
                }
            });
            
            // 4. Aggregate quantities for components that appear multiple times
            const flatBomMap = {};
            buyComponents.forEach(item => {
                if (!flatBomMap[item.componentId]) {
                    flatBomMap[item.componentId] = { ...item };
                } else {
                    // Add quantities together but keep original totalInventory
                    flatBomMap[item.componentId].qtyPerAssembly += item.qtyPerAssembly;
                }
            });
            
            const flatBom = Object.values(flatBomMap);
            
            // 5. Calculate additional buildable quantity
            let additionalFutureBuildable = 0;
            
            if (flatBom.length > 0) {
                const additionalQtys = flatBom.map(item => 
                    Math.floor(item.totalInventory / item.qtyPerAssembly)
                );
                
                additionalFutureBuildable = additionalQtys.length > 0 ? Math.min(...additionalQtys) : 0;
            }
            
            // 6. Calculate total future build capacity
            const totalFutureBuildCapacity = futureBuildCapacity + additionalFutureBuildable;
            
            return totalFutureBuildCapacity;
        },

        generateFlatBom: (bomData) => {
            const flatBom = [];
            const aggregatedBom = {};

            bomData.forEach(item => {
                if (item.qtyPerAssembly > 0 && !item.isMakePart) {
                    if (aggregatedBom[item.componentId]) {
                        aggregatedBom[item.componentId].qtyPerAssembly += item.qtyPerAssembly;
                    } else {
                        aggregatedBom[item.componentId] = { ...item };
                    }
                }
            });

            for (const componentId in aggregatedBom) {
                flatBom.push(aggregatedBom[componentId]);
            }

            return flatBom;
        }
    };

    window.dataProcessor = dataProcessor;
})();