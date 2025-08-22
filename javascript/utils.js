(function() {
    'use strict';

    // --- Utility Functions ---
    // General helper functions used throughout the application.
    const utils = {
        // Formats a number as currency
        formatCurrency: (value) => `$${Math.round(value).toLocaleString()}`,
        // Formats a number with thousand separators
        formatNumber: (value) => {
           return value === Infinity ? '∞' : value.toLocaleString();
        },
        // Sanitizes a number by removing commas and parsing as a float
        sanitizeNumber: (value) => parseFloat((value || '').toString().replace(/,/g, '')) || 0,
        // Sanitizes a value by parsing as an integer
        sanitizeInteger: (value) => parseInt(value) || 0,
        // Shows an element by removing the 'hidden' class
        showElement: (element) => element.classList.remove('hidden'),
        // Hides an element by adding the 'hidden' class
        hideElement: (element) => element.classList.add('hidden'),
        // Resets the file input element
        resetFileInput: () => dom.fileInput.value = '',
        // Updates the width of the upload progress bar
        updateProgressBar: (percentage) => dom.uploadProgress.style.width = `${percentage}%`,
        // Shows an alert message (consider replacing with a less intrusive notification system)
        showAlert: (message) => alert(message),
        // Logs an error message to the console
        logError: (message, error) => console.error(message, error),
        // Logs an information message to the console
        logInfo: (message) => {},
        // Logs a warning message to the console
        logWarn: (message) => console.warn(message),
        // Pad string with leading zeros
        padLeadingZeros: (str, length) => {
            // Ensure input is a string
            const stringValue = String(str);
            return stringValue.padStart(length, '0');
        },
        // Debounce function: delays function execution
        debounce: (func, delay) => {
            let debounceTimer;
            return function(...args) {
                const context = this;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => func.apply(context, args), delay);
            };
        },
        // Truncates a text string to a specified maximum length
        truncateText: (text, maxLength) => {
            return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
        }
    };

    window.utils = utils; // Expose utils to the global scope for other modules

})();