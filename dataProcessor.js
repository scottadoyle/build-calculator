(function() {
    'use strict';

    // --- Data Processing & Calculations ---
    // Handles calculations based on the parsed BOM data and user input.
    const dataProcessor = {
        // Performs initial data processing steps after CSV parsing is complete.
        processInitialData: () => {
            // CRITICAL FIX: Prevent multiple calls that corrupt BOM array order
            if (state.isDataProcessed) {
                utils.logInfo("BOM data already processed, skipping to prevent array corruption");
                return;
            }
            
            utils.logInfo("Processing BOM data...");
            try {
                // Multiple instances of the same component are VALID in BOM structures
                // Components can be used in different assemblies - this is not an error

                // Helper function to parse numbers with thousand separators
                function parseNumber(value) {
                    if (typeof value === 'string') {
                        return parseFloat(value.replace(/,/g, ''));
                    }
                    return parseFloat(value);
                }
        
                // CRITICAL FIX: Store original indices BEFORE filtering to preserve BOM hierarchy
                state.bomData.forEach((item, index) => {
                    // Parse qtyPerAssembly and itemCost using the helper function
                    item.qtyPerAssembly = parseNumber(item.qtyPerAssembly);
                    item.itemCost = parseNumber(item.itemCost);
                    
                    // Store original index for parent-child relationship preservation
                    item.originalIndex = index;
                    item.isMakePart = false;
                    item.totalQty = item.qtyPerAssembly;
                });
                
                // NOW filter out zero-quantity items (this changes array indices but we have originalIndex)
                state.bomData = state.bomData.filter(item => item.qtyPerAssembly > 0);
                
                // Calculate metrics on filtered data
                state.bomData.forEach((item, index) => {
                    dataProcessor.calculateBaseItemMetrics(item);
                    item.id = index; // Current filtered index
                });
                dataProcessor.calculateOverallMetrics();
                dataProcessor.determineMakeBuyStatus(); // Add make/buy flag
                // DIAGNOSTIC: Check bomData after processInitialData processing
                console.log("=== DIAGNOSTIC: bomData after processInitialData processing ===");
                console.log(`Total items processed: ${state.bomData.length}`);
                
                // Log component instances for key debugging components
                const debugComponents = ['15000174', '7000030'];
                debugComponents.forEach(componentId => {
                    const instances = state.bomData
                        .map((item, index) => ({ item, index }))
                        .filter(({ item }) => item.componentId === componentId);
                    if (instances.length > 0) {
                        console.log(`Component ${componentId} appears ${instances.length} time(s):`, 
                            instances.map(({ item, index }) => ({ index, level: item.bomLevel })));
                    }
                });

                state.originalBomData = [...state.bomData]; // Store original data
                state.filteredData = [...state.bomData]; // Initialize filtered data
                state.totalBuildCapacity = dataProcessor.calculateTotalBuildCapacity(state.bomData); // Calculate total build capacity
                state.totalFutureBuildCapacity = dataProcessor.calculateTotalFutureBuildCapacity(state.bomData); // Calculate total future build capacity
                
                // CRITICAL: Set flag to prevent multiple calls that would corrupt array order
                state.isDataProcessed = true;
                
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
        // using correct hierarchical parent-child relationships
        calculateBuildMetrics: (targetBuilds) => {
            let totalInvCost = 0;
            let totalOrderCost = 0;
            let totalAdditionalCost = 0;
            let totalBuildCostValue = 0;

            // Create a flat BOM for cost calculation to avoid hierarchical compounding
            const flatBom = dataProcessor.generateFlatBom(state.bomData);

            // Calculate total build cost using flat BOM approach
            flatBom.forEach(item => {
                const grossRequirement = targetBuilds * item.qtyPerAssembly;
                totalBuildCostValue += (grossRequirement * item.itemCost);
            });

            // CRITICAL FIX: Reset calculation-specific fields to ensure clean state for each calculation
            state.bomData.forEach(item => {
                delete item.grossRequirement;
                delete item.shortfall;
                delete item.orderQty;
                delete item.costToOrder;
            });

            // Calculate hierarchical requirements using proper MRP methodology
            // Process BOM in original order to maintain parent-child relationships
            
            // DIAGNOSTIC: Log BOM structure for debugging
            console.log("=== DIAGNOSTIC: BOM Structure Analysis ===");
            console.log(`Processing ${state.bomData.length} BOM items`);
            
            // Log instances of key components for debugging
            const debugComponents = ['15000174', '07000030'];
            debugComponents.forEach(componentId => {
                const instances = state.bomData
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.componentId === componentId);
                if (instances.length > 0) {
                    console.log(`Component ${componentId} found ${instances.length} time(s):`, 
                        instances.map(({ item, index }) => ({ index, level: item.bomLevel })));
                }
            });
            
            // Process components in original BOM order (preserves hierarchy)
            // This maintains the indented BOM structure integrity
            state.bomData.forEach((item, index) => {
                const currentLevel = item.bomLevel;
                let parentShortfall = targetBuilds; // Default for level 1 components
                let parentComponent = 'TOP_LEVEL';
                
                // For components at level 2 or higher, find the actual parent
                if (currentLevel > 1) {
                    // CRITICAL FIX: Use originalIndex to find parent in correct BOM hierarchy
                    // Search backwards based on original BOM order, not filtered array order
                    let parentFound = false;
                    
                    const candidateParents = state.bomData.filter(candidateItem => 
                        candidateItem.originalIndex < item.originalIndex && 
                        candidateItem.bomLevel === currentLevel - 1
                    );
                    
                    if (candidateParents.length > 0) {
                        // Get the parent with the highest originalIndex (closest before this component)
                        const immediateParent = candidateParents.reduce((latest, candidate) => 
                            candidate.originalIndex > latest.originalIndex ? candidate : latest
                        );
                        
                        parentShortfall = immediateParent.shortfall || 0;
                        parentComponent = immediateParent.componentId;
                        parentFound = true;
                        
                        if (item.componentId === '15000174') {
                            console.log(`  FIXED PARENT FINDING: Found ${parentComponent} (originalIndex: ${immediateParent.originalIndex}) for ${item.componentId} (originalIndex: ${item.originalIndex})`);
                            console.log(`  Parent shortfall: ${parentShortfall}`);
                        }
                    }
                    
                    if (!parentFound) {
                        console.warn(`Warning: No parent found for ${item.componentId} at level ${currentLevel}`);
                        // Fallback to top-level requirement if no parent found
                        parentShortfall = targetBuilds;
                        parentComponent = 'TOP_LEVEL_FALLBACK';
                    }
                }
                
                // Calculate this component's requirements based on parent's shortfall
                const grossRequirement = parentShortfall * item.qtyPerAssembly;
                const componentShortfall = Math.max(0, grossRequirement - item.onHand);
                
                // Store calculated values directly on the item
                item.grossRequirement = grossRequirement;
                item.shortfall = componentShortfall;
                
                // Debug trace for key components
                if (item.componentId === '07000030' || item.componentId === '15000174') {
                    console.log(`SEQUENTIAL: ${item.componentId} at Level ${currentLevel}, Index ${index}`);
                    console.log(`  Parent: ${parentComponent}, Parent shortfall: ${parentShortfall}`);
                    console.log(`  Gross needed: ${grossRequirement}, On hand: ${item.onHand}, Shortfall: ${componentShortfall}`);
                }
                
                // Calculate order quantities and costs
                if (componentShortfall > 0) {
                    item.orderQty = Math.ceil(componentShortfall / item.minOrderQty) * item.minOrderQty;
                } else {
                    item.orderQty = 0;
                }
                
                item.costToOrder = item.orderQty * item.itemCost;
                
                totalInvCost += (item.onHand * item.itemCost);
                totalOrderCost += (item.onOrder * item.itemCost);
                if (!item.isMakePart) {
                    totalAdditionalCost += item.costToOrder;
                }
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