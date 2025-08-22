# BOM Calculator Testing Guide

## Overview

This comprehensive testing framework systematically tests every JavaScript function in your BOM Calculator to identify and fix indented BOM calculation errors.

## Quick Start

1. **Open the test suite**: Open `tests.html` in your web browser
2. **Run all tests**: Click "🚀 Run All Tests" to execute the complete test suite
3. **Review results**: Check for failed tests (red) that indicate issues

## Test Coverage

### ✅ **Utils Functions** 
- Number formatting and parsing
- Currency formatting
- String manipulation
- Input sanitization

### ✅ **Data Processor Functions**
- BOM data processing and validation
- Metric calculations (canBuild, futureBuild)
- Flat BOM generation and aggregation
- Make/Buy status determination

### ✅ **Build Capacity Calculator**
- Make part capacity calculations
- Total build capacity algorithms
- Hierarchical capacity analysis

### ✅ **BOM Hierarchy & MRP Logic** 
- Parent-child relationship calculations
- Array order preservation
- Multiple calculation run integrity
- Sequential processing validation

### ✅ **Error Handling & Edge Cases**
- Malformed data handling
- Null/undefined input processing
- Division by zero scenarios
- Empty array handling

## Using the Test Results

### ✅ **Green Tests (Pass)**
Functions working correctly - no action needed.

### ❌ **Red Tests (Fail)**
Issues found - these need investigation:

1. **Check the error message** for specific details
2. **Review the function** mentioned in the test name
3. **Fix the underlying issue** in your code
4. **Re-run tests** to verify the fix

### ⚠️ **Warning Tests**
Potential issues or edge cases that need attention.

## Key Benefits

1. **Systematic Coverage**: Tests every critical function
2. **Regression Prevention**: Catch issues before they affect users
3. **Debug Assistance**: Pinpoint exact locations of calculation errors
4. **Confidence Building**: Verify fixes work correctly

## Best Practices

1. **Run tests after any code changes**
2. **Fix failing tests immediately**
3. **Add new tests when adding new functions**
4. **Use test results to guide debugging**

## Troubleshooting Common Issues

### Test File Won't Load
- Ensure all `.js` files are in the same directory
- Check browser console for missing file errors
- Verify file paths in `tests.html`

### Tests Keep Failing
- Check that `state.js` is properly initialized
- Verify BOM data structure matches expected format
- Review calculation logic in failing functions

### Performance Issues
- Run individual test suites instead of all tests
- Clear results between test runs
- Check browser memory usage

## Technical Details

- **Framework**: Custom lightweight testing framework
- **Assertions**: 10+ assertion types (assertEqual, assertTrue, etc.)
- **Test Organization**: Grouped into logical suites
- **Progress Tracking**: Real-time progress bars and status updates
- **Results**: Detailed pass/fail reporting with error messages

## Next Steps

1. **Fix failing tests** identified by the test suite
2. **Add regression tests** for any new bugs discovered
3. **Run tests regularly** during development
4. **Consider CI/CD integration** for automated testing

---

This testing framework gives you the systematic approach needed to identify and fix those difficult indented BOM calculation errors. Run it whenever you make changes to ensure your calculations remain accurate.