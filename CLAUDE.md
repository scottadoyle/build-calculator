# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is a client-side web application with no build process or test framework configured. To run the application:

1. Open `index.html` in a web browser
2. No installation or build commands required - uses CDN dependencies

## Architecture Overview

The Build Dashboard is a manufacturing capacity planning tool that analyzes NetSuite BOM CSV exports to calculate production capacity and inventory requirements.

### Core Architecture

**Modular JavaScript Structure**: The application uses a modular approach with separate files for different concerns:
- `script.js` - Main entry point and initialization
- `state.js` - Central state management for all application data
- `dom.js` - DOM element references and utilities
- `dataProcessor.js` - Core business logic for BOM calculations
- `buildCapacityCalculator.js` - Advanced capacity calculation algorithms
- `uiUpdater.js` - UI rendering and updates
- `chartManager.js` - Chart.js integration for data visualization
- `eventHandlers.js` - User interaction handling
- `fileHandler.js` - CSV upload and parsing with PapaParse
- `utils.js` - Helper functions for formatting and calculations
- `helpTexts.js` - Tooltip and help text content

### Data Flow

1. CSV files containing BOM data are uploaded and parsed with PapaParse
2. Data validation and mapping occurs in `fileHandler.js`
3. Core calculations happen in `dataProcessor.js` and `buildCapacityCalculator.js`
4. State is managed centrally in `state.js`
5. UI updates are handled by `uiUpdater.js`
6. Charts are managed by `chartManager.js`

### Key Calculations

- **Flat Build Capacity**: Based on level 1 components only
- **Total Build Capacity**: Analyzes entire BOM structure including subassemblies
- **Future Build Capacity**: Considers on-hand inventory plus components on order
- **Net Quantity Calculations**: Determines additional components needed for target build quantities

### Dependencies

All dependencies are loaded via CDN:
- PapaParse for CSV parsing
- Chart.js for data visualization
- Tailwind CSS for styling
- FontAwesome for icons

### BOM Data Structure

The application expects CSV files with these required columns:
- Component Name
- Level (BOM hierarchy level)
- Description
- BoM Quantity per Assembly
- On Hand
- Average Cost
- On Order
- Minimum Quantity

Components are categorized as "Make" or "Buy" items with different calculation logic applied to each type.