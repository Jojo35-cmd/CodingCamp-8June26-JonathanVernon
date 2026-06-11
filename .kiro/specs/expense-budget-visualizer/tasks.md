# Implementation Plan: Expense & Budget Visualizer

## Overview

This plan implements the Expense & Budget Visualizer as a fully client-side single-page application using HTML, CSS, and Vanilla JavaScript. Tasks follow a bottom-up dependency order: project structure → CSS → pure logic functions → DOM components → event wiring → app init → tests → manual verification.

## Tasks

- [x] 1. Set up project structure and HTML skeleton
  - [x] 1.1 Create `index.html` with semantic layout containing the four main sections: Balance Display, Input Form, Transaction List, and Chart, each in a visually distinct container with a heading
  - [x] 1.2 Add Chart.js CDN script tag and link to `css/style.css` and `js/app.js` in `index.html`
  - [x] 1.3 Add the form fields: `<input type="text" id="name-input">`, `<input type="number" id="amount-input">`, `<select id="category-select">` with Food/Transport/Fun options, and a submit button
  - [x] 1.4 Add `<span id="balance-amount">` inside the Balance Display section and `<ul id="transaction-list">` for the Transaction List
  - [x] 1.5 Add `<canvas id="expense-chart">` inside the Chart section
  - **Requirements:** 6.1, 6.2, 6.3, 6.4, 7.3

- [x] 2. Implement base CSS styling
  - [x] 2.1 Create `css/style.css` with CSS custom properties for colors and fonts
  - [x] 2.2 Style the four main sections as visually distinct containers (card/panel appearance with borders or background)
  - [x] 2.3 Set minimum font size to 16px and ensure the layout is responsive without horizontal scrolling at viewports 320px and above
  - [x] 2.4 Style `.error-msg` spans for inline field error messages (e.g., red text, small font)
  - [x] 2.5 Style the `.banner` and `.banner--error` classes for dismissible error banners
  - [x] 2.6 Style `#transaction-list` with `overflow-y: auto` and a fixed max-height to enable scrolling
  - **Requirements:** 7.3, 7.4, 6.3

- [x] 3. Implement storage module (`loadFromStorage`, `saveToStorage`, `clearStorage`)
  - [x] 3.1 Implement `saveToStorage(transactions)` that serializes the array to JSON and writes it under the key `"transactions"` in `localStorage`; catch `QuotaExceededError` and any write exception, calling `showStorageError()` on failure
  - [x] 3.2 Implement `loadFromStorage()` that reads `localStorage["transactions"]`, returns `[]` for `null`, parses JSON, validates that the result is an array where every element has `name` (string), `amount` (finite number ≥ 0.01 ≤ 999999999.99), and `category` (one of Food/Transport/Fun); on any failure calls `clearStorage()` and returns an error signal
  - [x] 3.3 Implement `clearStorage()` that removes the `"transactions"` key from `localStorage`
  - **Requirements:** 5.1, 5.2, 5.3, 5.4, 5.5

- [ ] 4. Implement form validation (`validateName`, `validateAmount`, `validateForm`)
  - [x] 4.1 Implement `validateName(value)` that returns `{ valid: true }` when the trimmed string has length between 1 and 100 inclusive, and `{ valid: false, error: '<message>' }` otherwise
  - [x] 4.2 Implement `validateAmount(value)` that returns `{ valid: true }` when the value is a finite number between 0.01 and 999999999.99 with at most 2 decimal places, and `{ valid: false, error: '<message>' }` otherwise
  - [x] 4.3 Implement `validateForm()` that calls `validateName` and `validateAmount` and returns `{ valid: boolean, errors: { name?, amount? } }`
  - [x] 4.4 Implement `showFieldError(fieldId, message)` that inserts a `<span class="error-msg">` immediately after the field element
  - [x] 4.5 Implement `clearFieldErrors()` that removes all `.error-msg` elements from the DOM
  - **Requirements:** 1.1, 1.5, 1.6

- [x] 5. Implement balance computation and rendering (`computeBalance`, `renderBalance`)
  - [x] 5.1 Implement `computeBalance(transactions)` as a pure function that returns the arithmetic sum of all `amount` values formatted as `"$X.XX"`, returning `"$0.00"` for an empty array
  - [x] 5.2 Implement `renderBalance()` that calls `computeBalance(transactions)` and sets the `textContent` of `#balance-amount`
  - **Requirements:** 3.1, 3.4

- [x] 6. Implement Chart.js integration (`initChart`, `computeChartData`, `updateChart`)
  - [x] 6.1 Implement `computeChartData(transactions)` as a pure function that groups amounts by category, filters out categories with zero total, and returns `{ labels: string[], data: number[] }` — labels and data arrays covering only categories with nonzero spending
  - [x] 6.2 Implement `initChart()` that creates a `Chart` instance on `#expense-chart` with `type: 'pie'`, empty initial data, and the configuration from the design (responsive, legend at bottom, colors `#FF6384`, `#36A2EB`, `#FFCE56` for Food, Transport, Fun respectively); store the instance in `let chart`
  - [x] 6.3 Implement `updateChart()` that calls `computeChartData(transactions)`, mutates `chart.data.labels` and `chart.data.datasets[0].data`, then calls `chart.update()`; when transactions is empty, sets both arrays to `[]`
  - **Requirements:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6

- [x] 7. Implement transaction list rendering (`renderTransactionList`, `createTransactionElement`)
  - [x] 7.1 Implement `createTransactionElement(transaction, index)` that returns an `<li>` containing the transaction name, amount formatted to two decimal places, category label, and a delete button with `data-index` attribute set to `index`
  - [x] 7.2 Implement `renderTransactionList()` that clears `#transaction-list` and either re-renders one `<li>` per transaction using `createTransactionElement` or inserts a placeholder `<li>` with the text "No transactions yet" if the array is empty
  - **Requirements:** 2.1, 2.2, 2.5

- [x] 8. Implement add transaction flow (`addTransaction`, `handleFormSubmit`, `resetForm`)
  - [x] 8.1 Implement `addTransaction(name, amount, category)` that pushes a `{ name, amount, category }` object onto the in-memory `transactions` array, calls `saveToStorage(transactions)`, then calls `renderTransactionList()`, `renderBalance()`, and `updateChart()`
  - [x] 8.2 Implement `handleFormSubmit(event)` that calls `event.preventDefault()`, `clearFieldErrors()`, `validateForm()`, shows errors via `showFieldError` on failure, and calls `addTransaction` + `resetForm()` on success
  - [x] 8.3 Implement `resetForm()` that resets the form element and calls `clearFieldErrors()`
  - [x] 8.4 Wire `handleFormSubmit` to the `submit` event of `#transaction-form`
  - **Requirements:** 1.2, 1.3, 1.4, 1.5, 1.6, 5.1

- [x] 9. Implement delete transaction flow (`deleteTransaction`, `handleDeleteClick`)
  - [x] 9.1 Implement `deleteTransaction(index)` that removes the element at `index` from the in-memory `transactions` array using `splice`, calls `saveToStorage(transactions)`, then calls `renderTransactionList()`, `renderBalance()`, and `updateChart()`
  - [x] 9.2 Implement `handleDeleteClick(event)` using event delegation on `#transaction-list`: check if `event.target` has a `data-index` attribute and call `deleteTransaction(parseInt(event.target.dataset.index))`
  - [x] 9.3 Wire `handleDeleteClick` to the `click` event of `#transaction-list`
  - **Requirements:** 2.6, 2.7, 5.2

- [x] 10. Implement error display banners (`showStorageError`, `showCorruptDataError`)
  - [x] 10.1 Implement `showStorageError()` that renders a `<div role="alert" class="banner banner--error">` with the message "Could not save data — storage quota exceeded." and a close button (`×`) that removes the element on click
  - [x] 10.2 Implement `showCorruptDataError()` that renders a `<div role="alert" class="banner banner--error">` with the message "Saved data was corrupted and has been cleared." and a close button
  - **Requirements:** 5.4, 5.5

- [x] 11. Implement app initialisation (`initApp`, `DOMContentLoaded`)
  - [x] 11.1 Implement `initApp()` that calls `loadFromStorage()`, handles the error signal by calling `showCorruptDataError()` and initialising all components with `[]`, or on success sets the in-memory `transactions` array and calls `renderTransactionList()`, `renderBalance()`, and `updateChart()`
  - [x] 11.2 Call `initChart()` and then `initApp()` inside a `DOMContentLoaded` event listener
  - **Requirements:** 2.4, 5.3, 5.4

- [x] 12. Write property-based tests for validation functions
  - [x] 12.1 Set up fast-check in the test environment (e.g., `tests/app.test.js` loaded via a test HTML page or Node.js runner using fast-check from CDN/npm for test-only)
  - [x] 12.2 Write property test for **Property 1** — name validation: for any string, `validateName` returns invalid iff trimmed length is 0 or > 100
    - **Validates: Requirements 1.1, 1.5**
  - [x] 12.3 Write property test for **Property 2** — amount validation: for any value, `validateAmount` returns invalid iff the value is non-numeric, < 0.01, > 999999999.99, or has more than 2 decimal places
    - **Validates: Requirements 1.1, 1.6**
  - Each test runs a minimum of 100 iterations and is tagged with the comment: `// Feature: expense-budget-visualizer, Property N: <description>`

- [ ] 13. Write property-based tests for core logic functions
  - [x] 13.1 Write property test for **Property 7** — balance computation: for any array of transactions, `computeBalance` returns the exact arithmetic sum formatted as `"$X.XX"`, returning `"$0.00"` for an empty array
    - **Validates: Requirements 3.1, 3.4**
  - [ ] 13.2 Write property test for **Property 8** — chart data proportionality: for any non-empty transaction array, `computeChartData` returns only categories with nonzero spending and their correct summed amounts
    - **Validates: Requirements 4.1, 4.5**
  - [~] 13.3 Write property test for **Property 5** — delete integrity: for any transactions array of length n ≥ 1 and valid index i, after `deleteTransaction(i)` the array has length n−1, does not contain the deleted transaction, and preserves relative order of all others; localStorage reflects the same
    - **Validates: Requirements 2.6, 2.7**
  - [~] 13.4 Write property test for **Property 3** — add transaction round-trip: for any valid transaction, after `addTransaction()` the in-memory array contains it and `loadFromStorage()` returns an array that includes it
    - **Validates: Requirements 1.2, 1.3**
  - [~] 13.5 Write property test for **Property 6** — storage round-trip: for any valid transaction array, `saveToStorage` + `loadFromStorage` returns a deeply equal array
    - **Validates: Requirements 2.4, 5.3**
  - [~] 13.6 Write property test for **Property 9** — corrupt storage: for any value stored in localStorage that is not a valid transaction array, `loadFromStorage` signals an error, `clearStorage` is called, and all components initialise to empty/zero state
    - **Validates: Requirements 5.4**

- [ ] 14. Write unit and example tests
  - [~] 14.1 Write example test: `loadFromStorage` returns `[]` when localStorage key is `null` (first visit)
    - **Validates: Requirements 5.3**
  - [~] 14.2 Write example test: `renderTransactionList` shows "No transactions yet" placeholder when the transactions array is empty
    - **Validates: Requirements 2.1**
  - [~] 14.3 Write example test: `resetForm` clears all field values after a successful submission
    - **Validates: Requirements 1.4**
  - [~] 14.4 Write example test: `showStorageError` is called when `localStorage.setItem` throws `QuotaExceededError`
    - **Validates: Requirements 5.5**
  - [~] 14.5 Write property test for **Property 4** — transaction list rendering: for any transaction array, `renderTransactionList` produces one row per transaction with name, amount formatted to two decimal places, and category label
    - **Validates: Requirements 2.2**

- [ ] 15. Manual and smoke test verification
  - [~] 15.1 Verify smoke test: app loads and all input fields are enabled with no loading indicator in under 3 seconds
  - [~] 15.2 Verify smoke test: `#transaction-list` has CSS `overflow-y: auto` or `scroll` on the container
  - [~] 15.3 Verify smoke test: Chart.js (not another library) is instantiated on `#expense-chart`
  - [~] 15.4 Verify smoke test: app renders without horizontal scroll at 320px viewport width and font size is ≥ 16px at default zoom
  - [~] 15.5 Manually test the full add-transaction flow: fill form, submit, verify entry in list, balance updates, chart updates
  - [~] 15.6 Manually test the full delete-transaction flow: click delete, verify entry removed, balance updates, chart updates
  - [~] 15.7 Manually test form validation: submit empty form and submit with invalid amount; verify inline error messages
  - [~] 15.8 Manually test page reload persistence: add transactions, reload, verify list/balance/chart are restored
  - [~] 15.9 Manually test corrupt data handling: set invalid JSON in localStorage manually, reload, verify error banner and empty state
  - [~] 15.10 Test in current stable Chrome, Firefox, Edge, and Safari
  - **Requirements:** 7.1, 7.2, 7.3, 7.4, 6.5

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "3", "4", "5", "6", "7"] },
    { "wave": 2, "tasks": ["2", "8", "9", "10"] },
    { "wave": 3, "tasks": ["11"] },
    { "wave": 4, "tasks": ["12", "13", "14"] },
    { "wave": 5, "tasks": ["15"] }
  ]
}
```

## Notes

- Tasks 1–11 are implementation tasks and must be completed in dependency order. Tasks 3–7 are independent of each other and can be implemented in parallel.
- Tasks 12–14 are the automated test suite. They require the corresponding implementation tasks to be complete before the tests can be run, but test code can be written alongside implementation.
- Task 15 is manual verification and should be done last, after all implementation and automated tests pass.
- The `tests/` directory is for test files only and does not affect the production file structure constraint (one CSS file in `css/`, one JS file in `js/`).
- fast-check is a test-only dependency and does not violate the "no build tools / no additional JS libraries" constraint for the production app.
