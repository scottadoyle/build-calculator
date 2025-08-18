# Build Dashboard (CSV)

## Application Overview
The Build Dashboard is a web-based application for manufacturing companies that helps production planners analyze bill of materials (BOM) data and inventory to determine production capacity. The application imports CSV files exported from NetSuite containing component information, inventory levels, and costs to calculate how many units of a product can be built with the current inventory and what additional components need to be ordered.

## Key Features
- Upload and process BOM CSV files exported from NetSuite
- Calculate current build capacity based on available inventory
- Determine total build capacity considering subassembly creation
- Calculate future build capacity after pending purchase orders arrive
- Display cost information including total inventory value, open order costs, and additional costs needed
- View BOM data in both flat and indented formats
- Highlight limiting components that restrict production capacity
- Visual representations of inventory status and cost distribution through charts
- Search functionality to filter BOM components
- Export capability for creating reports

## Technical Architecture

### File Structure
- index.html - Main HTML structure and UI elements
- style.css - CSS styling for the application
- script.js - Main JavaScript entry point and initialization
- state.js - Central state management for application data
- dom.js - DOM element references and utilities
- utils.js - Helper functions for formatting and calculations
- helpTexts.js - Text descriptions for tooltips and help features
- fileHandler.js - Manages file uploads and CSV parsing
- dataProcessor.js - Core business logic for calculations
- uiUpdater.js - Functions for rendering and updating the UI
- chartManager.js - Manages the creation and updating of charts
- eventHandlers.js - User interaction event handling
- buildCapacityCalculator.js - Advanced algorithms for capacity calculations

### Data Flow
1. User uploads a CSV file exported from NetSuite
2. The file is parsed using PapaParse library
3. Data is validated, sanitized, and mapped to the application's internal data structure
4. Initial processing determines make/buy status of components and calculates base metrics
5. The UI is updated to show the dashboard with initial calculations
6. User can adjust the target build quantity to see how many units can be built
7. Components needed for the specified build quantity are calculated
8. The UI updates to show shortfalls, required order quantities, and associated costs
9. Charts are regenerated to visualize the updated data

### Key Algorithms
- Flat build capacity calculation: Determines buildable quantity based on level 1 components
- Total build capacity calculation: Analyzes component usage across the entire BOM structure including subassemblies
- Future build capacity: Considers both on-hand inventory and components on order
- Net quantity needed calculation: Determines additional components needed based on target build quantity
- Order quantity calculation: Considers minimum order quantities when determining what to order

### Technologies Used
- HTML5/CSS3 with Tailwind CSS for responsive UI
- JavaScript (ES6+) for application logic
- PapaParse for CSV parsing
- Chart.js for data visualization
- FontAwesome for icons

This application provides manufacturing teams with comprehensive insights into their production capabilities and inventory requirements, enabling more efficient planning and cost control.