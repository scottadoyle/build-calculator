(function() {
    'use strict';

    // --- File Handling & Parsing ---
    // Manages file input, drag/drop, reading, and CSV parsing using PapaParse.
    const fileHandler = {
        // Handles file selection via input or drag/drop.
        handleUpload: () => {
            // Get the selected file from the file input element
            const file = dom.fileInput.files[0];
            // If no file is selected, return
            if (!file) return;

            // Display the file name and size
            dom.fileName.textContent = file.name;
            dom.fileSize.textContent = `(${(file.size / 1024).toFixed(1)} KB)`;
            utils.showElement(dom.fileInfo);
            // Simulate progress and parse the file
            fileHandler.simulateProgressAndParse(file);
        },

        // Provides visual feedback by simulating an upload progress bar.
        simulateProgressAndParse: (file) => {
            // Initialize progress to 0
            let progress = 0;
            utils.updateProgressBar(progress);
            // Simulate progress with an interval
            const progressInterval = setInterval(() => {
                progress += 10;
                utils.updateProgressBar(progress);
                // When progress reaches 100%, clear the interval and parse the CSV file
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    fileHandler.parseCsv(file);
                }
            }, 100);
        },

        // Uses FileReader API to read the file and PapaParse library to parse the CSV content.
        parseCsv: (file) => {
            // Create a new FileReader instance
            const reader = new FileReader();
            // Define the onload event handler
            reader.onload = (e) => {
                try {
                    // Get the CSV text from the FileReader result
                    const csvText = e.target.result;
                    // Use Papa.parse to parse the CSV text
                    Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: true,
                        dynamicTyping: false, // Ensure consistent data types by parsing manually using utils.sanitize*
                        complete: fileHandler.processParsedResults, // Callback for successful parsing
                        error: fileHandler.handleParseError, // Callback for parsing errors
                        delimiter: ","
                    });
                } catch (error) {
                    utils.logError("Error reading CSV file:", error);
                    utils.showAlert(`Error reading CSV file: ${error.message}`);
                    eventHandlers.resetDashboard();
                }
            };
            reader.onerror = () => {
                utils.logError("FileReader error");
                utils.showAlert("Error reading the file");
                eventHandlers.resetDashboard();
            };
            reader.readAsText(file);
        },

        // Callback function for PapaParse upon successful completion.
        // Processes the parsed data, maps it to the internal structure, and triggers initial processing.
        processParsedResults: (results) => {
            try {
                // Check for parsing errors
                if (results.errors && results.errors.length > 0) {
                    utils.logError("CSV parsing errors:", results.errors);
                    throw new Error(`Error parsing CSV: ${results.errors[0].message}`);
                }

                // Get the number of headers
                const headerCount = results.meta.fields.length;
                // Filter out rows that don't have the correct number of columns
                const validRows = results.data.filter(row => Object.keys(row).length === headerCount);

                // Map the valid rows to the internal data structure and filter out any null values
                state.bomData = validRows.map(fileHandler.mapCsvRow).filter(item => item !== null);

                if (state.bomData.length === 0) {
                    throw new Error('No valid BOM data found in CSV. Check required columns and ensure quantities are not zero.');
                }

                utils.logInfo(`Successfully parsed CSV with ${state.bomData.length} items`);
                if (state.bomData.length > 0) {
                    dataProcessor.processInitialData();
                    uiUpdater.initializeDashboardView();
                } else {
                    utils.showAlert('No valid BOM data found in CSV. Check required columns and ensure quantities are not zero.');
                }
            } catch (error) {
                utils.logError("Error processing CSV data:", error);
                utils.showAlert(`Error processing CSV data: ${error.message}`);
                eventHandlers.resetDashboard();
            }
        },

        // Maps a single row from the parsed CSV data to the application's internal item structure.
        // Performs data sanitization and skips invalid rows.
        mapCsvRow: (row) => {
            const componentName = row['Component Name'] || '';
            // Skip rows without a Component Name or specific unwanted components
            if (!componentName || componentName === '' || componentName === 'CD Labor Consumption') {
                return null;
            }

            // Sanitize and map data to the internal structure
            const bomQty = utils.sanitizeNumber(row['BoM Quantity per Assembly'] || row['Quantity per Assembly']);
            // Skip components with 0 quantity
            if (bomQty === 0) {
                return null;
            }

            return {
                componentId: utils.padLeadingZeros(componentName, 8), // Use the variable
                bomLevel: utils.sanitizeInteger(row['Level']) || 1,
                description: row['Description'] || '',
                qtyPerAssembly: bomQty,
                onHand: utils.sanitizeNumber(row['On Hand']),
                itemCost: utils.sanitizeNumber(row['Average Cost']),
                onOrder: utils.sanitizeNumber(row['On Order']),
                minOrderQty: utils.sanitizeInteger(row['Minimum Quantity']) || 1 // Default Min Order Qty to 1 if not provided/invalid
            };
        },

        // Callback function for PapaParse if an error occurs during parsing.
        handleParseError: (error) => {
            // Log the error message
            utils.logError("CSV parsing error:", error);
            // Show an alert to the user
            utils.showAlert(`Error parsing CSV file: ${error.message}`);
            // Reset the dashboard
            eventHandlers.resetDashboard();
        }
    };

    window.fileHandler = fileHandler; // Expose fileHandler to the global scope for other modules

})();
