/**
 * Expense & Budget Visualizer
 * Author: Jonathan Vernon
 * Course: RevoU Coding Camp — Mini Project
 *
 * All application logic lives in this single file.
 * Section markers (// === SECTION ===) indicate where each task's
 * functions are defined.
 */

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY = 'transactions';
const CATEGORIES  = ['Food', 'Transport', 'Fun'];

// ============================================================
// GLOBAL STATE
// ============================================================

let transactions = [];  // single source of truth at runtime
let chart        = null; // Chart.js instance reference

// ============================================================
// TASK 3 — STORAGE MODULE
// ============================================================

/**
 * saveToStorage(transactions)
 * Serializes the transactions array to JSON and writes it to
 * localStorage under STORAGE_KEY.  On QuotaExceededError or any
 * other write exception the in-memory state is left intact and
 * showStorageError() is called to notify the user.
 *
 * Requirements: 5.1, 5.2, 5.5
 *
 * @param {Array} transactions - The current in-memory transactions array.
 */
function saveToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    // Catches QuotaExceededError (and any other setItem failure).
    // In-memory state is intentionally NOT rolled back — the
    // transaction remains visible for the current session.
    showStorageError();
  }
}

/**
 * loadFromStorage()
 * Reads localStorage[STORAGE_KEY] and returns the parsed transaction
 * array, or specific signals depending on the stored value:
 *
 *   - null key  → first visit / cleared storage → return []  (no error)
 *   - valid JSON array with valid entries → return the parsed array
 *   - any other value (bad JSON, not an array, invalid entries)
 *       → call clearStorage(), return { error: true }
 *
 * Validation rules per entry:
 *   name     : typeof string (non-empty after trim is NOT re-checked
 *              here — we trust previously saved data passed form validation;
 *              we only verify the type to guard against foreign/tampered data)
 *   amount   : isFinite number, >= 0.01, <= 999999999.99
 *   category : one of CATEGORIES ('Food', 'Transport', 'Fun')
 *
 * Requirements: 5.3, 5.4
 *
 * @returns {Array|{error: true}} Parsed array on success, [] on first
 *   visit, or { error: true } when data is corrupt/invalid.
 */
function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);

  // First visit or storage was explicitly cleared — normal empty state.
  if (raw === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    // Must be an array.
    if (!Array.isArray(parsed)) {
      throw new Error('Not an array');
    }

    // Validate every entry.
    for (const entry of parsed) {
      if (!isValidTransaction(entry)) {
        throw new Error('Invalid transaction entry');
      }
    }

    return parsed;

  } catch (_err) {
    // Corrupt or tampered data — discard it.
    clearStorage();
    return { error: true };
  }
}

/**
 * isValidTransaction(entry)
 * Pure helper that returns true when an object satisfies the
 * Transaction schema used by loadFromStorage validation.
 *
 * @param {*} entry - Value to test.
 * @returns {boolean}
 */
function isValidTransaction(entry) {
  if (entry === null || typeof entry !== 'object') return false;

  // name must be a string
  if (typeof entry.name !== 'string') return false;

  // amount must be a finite number within the valid range
  if (
    typeof entry.amount !== 'number' ||
    !isFinite(entry.amount) ||
    entry.amount < 0.01 ||
    entry.amount > 999999999.99
  ) return false;

  // category must be one of the three allowed values
  if (!CATEGORIES.includes(entry.category)) return false;

  return true;
}

/**
 * clearStorage()
 * Removes the transactions key from localStorage.
 *
 * Requirements: 5.4
 */
function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================
// TASK 4 — FORM VALIDATION
// (validateName, validateAmount, validateForm,
//  showFieldError, clearFieldErrors)
// ============================================================

/**
 * validateName(value)
 * Validates the transaction name field.
 *
 * Rules (Requirements 1.1, 1.5):
 *   - Trimmed length must be ≥ 1 (non-empty)
 *   - Trimmed length must be ≤ 100 characters
 *
 * @param {string} value - The raw value from the name input field.
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
function validateName(value) {
  const trimmed = (typeof value === 'string' ? value : '').trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Item name is required.' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Item name must be 100 characters or fewer.' };
  }

  return { valid: true };
}

/**
 * validateAmount(value)
 * Validates the transaction amount field.
 *
 * Rules (Requirements 1.1, 1.6):
 *   - Must be parseable as a finite number
 *   - Must be ≥ 0.01
 *   - Must be ≤ 999,999,999.99
 *   - Must have at most 2 decimal places
 *
 * @param {string|number} value - The raw value from the amount input field.
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
function validateAmount(value) {
  // Treat blank / whitespace-only strings as missing
  if (value === '' || value === null || value === undefined ||
      (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, error: 'Amount is required.' };
  }

  const num = parseFloat(value);

  if (!isFinite(num) || isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number.' };
  }

  if (num < 0.01) {
    return { valid: false, error: 'Amount must be at least $0.01.' };
  }

  if (num > 999999999.99) {
    return { valid: false, error: 'Amount cannot exceed $999,999,999.99.' };
  }

  // Check decimal places: convert to string and inspect digits after the dot.
  // Use the string representation of the parsed number (not the raw input)
  // to normalise scientific notation and trailing zeros.
  const strValue = String(value).trim();
  const dotIndex = strValue.indexOf('.');
  if (dotIndex !== -1 && strValue.length - dotIndex - 1 > 2) {
    return { valid: false, error: 'Amount cannot have more than 2 decimal places.' };
  }

  return { valid: true };
}

/**
 * validateForm()
 * Reads both form fields from the DOM and runs all validators.
 * Returns a combined result describing validity and any field-level errors.
 *
 * Requirements: 1.1, 1.5, 1.6
 *
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string } }}
 */
function validateForm() {
  const nameInput   = document.getElementById('name-input');
  const amountInput = document.getElementById('amount-input');

  const nameValue   = nameInput   ? nameInput.value   : '';
  const amountValue = amountInput ? amountInput.value : '';

  const nameResult   = validateName(nameValue);
  const amountResult = validateAmount(amountValue);

  const errors = {};

  if (!nameResult.valid) {
    errors.name = nameResult.error;
  }

  if (!amountResult.valid) {
    errors.amount = amountResult.error;
  }

  return {
    valid: nameResult.valid && amountResult.valid,
    errors,
  };
}

/**
 * showFieldError(fieldId, message)
 * Inserts an accessible inline error message immediately after the
 * specified form field element.
 *
 * The injected element:
 *   <span class="error-msg" role="alert">message</span>
 *
 * Requirements: 1.5, 1.6
 *
 * @param {string} fieldId - The `id` attribute of the input/select element.
 * @param {string} message - The error text to display.
 */
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const span = document.createElement('span');
  span.className = 'error-msg';
  span.setAttribute('role', 'alert');
  span.textContent = message;

  field.insertAdjacentElement('afterend', span);
}

/**
 * clearFieldErrors()
 * Removes all inline error message elements from the DOM.
 * Called before each validation pass so stale errors never accumulate.
 *
 * Requirements: 1.5, 1.6
 */
function clearFieldErrors() {
  document.querySelectorAll('.error-msg').forEach(function (el) {
    el.remove();
  });
}

// ============================================================
// TASK 5 — BALANCE COMPUTATION & RENDERING
// (computeBalance, renderBalance)
// ============================================================

/**
 * computeBalance(transactions)
 * Pure function — returns the arithmetic sum of all `amount` values in
 * the provided transactions array, formatted as a currency string "$X.XX".
 *
 * - Returns "$0.00" for an empty array.
 * - Uses integer-cent arithmetic to avoid IEEE 754 floating-point drift
 *   (e.g., 0.1 + 0.2 === 0.30000000000000004), then converts back to
 *   dollars before formatting.
 *
 * Requirements: 3.1, 3.4
 *
 * @param {Array<{amount: number}>} transactions - Array of transaction objects.
 * @returns {string} Formatted balance string, e.g. "$12.50".
 */
function computeBalance(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return '$0.00';
  }

  // Sum in integer cents to avoid floating-point accumulation errors.
  const totalCents = transactions.reduce(function (acc, tx) {
    return acc + Math.round(tx.amount * 100);
  }, 0);

  return '$' + (totalCents / 100).toFixed(2);
}

/**
 * renderBalance()
 * Reads the global `transactions` array, computes the running total via
 * computeBalance(), and writes the formatted string to #balance-amount.
 *
 * Requirements: 3.1, 3.4
 */
function renderBalance() {
  const balanceEl = document.getElementById('balance-amount');
  if (balanceEl) {
    balanceEl.textContent = computeBalance(transactions);
  }
}

// ============================================================
// TASK 6 — CHART.JS INTEGRATION
// (computeChartData, initChart, updateChart)
// ============================================================

/**
 * computeChartData(transactions)
 * Pure function — groups transaction amounts by category and returns
 * only the categories that have a nonzero total.
 *
 * Category order is preserved as defined in CATEGORIES
 * ('Food', 'Transport', 'Fun') so that Chart.js backgroundColor
 * indices stay consistent with the color array.
 *
 * - Returns { labels: [], data: [] } for an empty transactions array.
 * - Categories whose total equals 0 are excluded from the output.
 *
 * Requirements: 4.1, 4.5
 *
 * @param {Array<{amount: number, category: string}>} transactions
 * @returns {{ labels: string[], data: number[] }}
 */
function computeChartData(transactions) {
  // Initialise totals for every category to 0.
  const totals = {};
  CATEGORIES.forEach(function (cat) {
    totals[cat] = 0;
  });

  // Sum amounts per category using integer-cent arithmetic to avoid
  // IEEE 754 floating-point accumulation errors.
  if (Array.isArray(transactions)) {
    transactions.forEach(function (tx) {
      if (totals.hasOwnProperty(tx.category)) {
        totals[tx.category] += Math.round(tx.amount * 100);
      }
    });
  }

  // Build output arrays, maintaining CATEGORIES order and excluding zeros.
  const labels = [];
  const data   = [];

  CATEGORIES.forEach(function (cat) {
    if (totals[cat] > 0) {
      labels.push(cat);
      data.push(totals[cat] / 100); // convert back to dollars
    }
  });

  return { labels: labels, data: data };
}

/**
 * initChart()
 * Creates the Chart.js pie chart instance on the #expense-chart canvas
 * and stores the reference in the global `chart` variable.
 *
 * Called once on page load (from initApp). The chart starts with empty
 * labels and data; updateChart() populates it from the transactions array.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
function initChart() {
  const canvas = document.getElementById('expense-chart');
  chart = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

/**
 * updateChart()
 * Recomputes chart data from the global `transactions` array and
 * mutates the existing Chart.js instance in-place to avoid canvas flicker.
 *
 * When transactions is empty, computeChartData returns { labels: [], data: [] }
 * so both arrays are set to [] and the chart renders with no segments.
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5
 */
function updateChart() {
  const chartData = computeChartData(transactions);
  chart.data.labels          = chartData.labels;
  chart.data.datasets[0].data = chartData.data;
  chart.update();
}

// ============================================================
// TASK 7 — TRANSACTION LIST RENDERING
// (createTransactionElement, renderTransactionList)
// ============================================================

/**
 * createTransactionElement(transaction, index)
 * Pure DOM-creation function — builds and returns a single <li> element
 * representing one transaction row in the transaction list.
 *
 * The returned element contains:
 *   - A <span class="transaction-name"> with the transaction name
 *   - A <span class="transaction-amount"> with the amount formatted to 2 d.p.
 *   - A <span class="transaction-category"> with the category label
 *   - A <button class="btn-delete"> with data-index set to the index parameter
 *
 * Does NOT mutate any global state.
 *
 * Requirements: 2.2, 2.5
 *
 * @param {{ name: string, amount: number, category: string }} transaction
 * @param {number} index - The position of this transaction in the global array.
 * @returns {HTMLLIElement}
 */
function createTransactionElement(transaction, index) {
  const li = document.createElement('li');

  // Transaction name
  const nameSpan = document.createElement('span');
  nameSpan.className = 'transaction-name';
  nameSpan.textContent = transaction.name;

  // Amount formatted to exactly 2 decimal places (e.g. "4.50")
  const amountSpan = document.createElement('span');
  amountSpan.className = 'transaction-amount';
  amountSpan.textContent = transaction.amount.toFixed(2);

  // Category label
  const categorySpan = document.createElement('span');
  categorySpan.className = 'transaction-category';
  categorySpan.textContent = transaction.category;

  // Delete button with data-index attribute
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete';
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('data-index', index);

  li.appendChild(nameSpan);
  li.appendChild(amountSpan);
  li.appendChild(categorySpan);
  li.appendChild(deleteBtn);

  return li;
}

/**
 * renderTransactionList()
 * Clears the #transaction-list <ul> and re-populates it from the global
 * `transactions` array.
 *
 * - If the array is empty, inserts a single placeholder <li> with the
 *   text "No transactions yet".
 * - Otherwise, calls createTransactionElement(transaction, index) for
 *   each entry and appends the returned <li> to the list.
 *
 * Requirements: 2.1, 2.2, 2.5
 */
function renderTransactionList() {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  // Clear existing contents.
  list.innerHTML = '';

  if (transactions.length === 0) {
    // Placeholder when there are no transactions.
    const placeholder = document.createElement('li');
    placeholder.textContent = 'No transactions yet';
    list.appendChild(placeholder);
  } else {
    // One <li> per transaction.
    transactions.forEach(function (transaction, index) {
      list.appendChild(createTransactionElement(transaction, index));
    });
  }
}

// ============================================================
// TASK 8 — ADD TRANSACTION FLOW
// (addTransaction, handleFormSubmit, resetForm)
// ============================================================

/**
 * addTransaction(name, amount, category)
 * Appends a new transaction object to the global `transactions` array,
 * persists it to localStorage, then refreshes all affected UI regions.
 *
 * Requirements: 1.2, 1.3, 5.1
 *
 * @param {string} name     - The transaction name (already validated).
 * @param {string|number} amount   - The raw amount value; stored as a float.
 * @param {string} category - One of CATEGORIES ('Food', 'Transport', 'Fun').
 */
function addTransaction(name, amount, category) {
  // 1. Push the new entry onto the in-memory array.
  transactions.push({ name: name, amount: parseFloat(amount), category: category });

  // 2. Persist to localStorage BEFORE any UI update (Req 5.1).
  saveToStorage(transactions);

  // 3. Refresh all UI regions that depend on transactions.
  renderTransactionList();
  renderBalance();
  updateChart();
}

/**
 * handleFormSubmit(event)
 * Handles the expense form's submit event. Prevents the default browser
 * form submission, clears any previous field errors, validates the form,
 * and either shows inline errors or commits the new transaction.
 *
 * On validation failure: calls showFieldError for each failing field, then
 * returns early so the form stays open for correction.
 *
 * On validation success: reads name, amount, and category from the DOM,
 * calls addTransaction(), then calls resetForm() to clear the inputs.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 5.1
 *
 * @param {Event} event - The form submit event.
 */
function handleFormSubmit(event) {
  event.preventDefault();

  clearFieldErrors();

  const { valid, errors } = validateForm();

  if (!valid) {
    if (errors.name)   showFieldError('name-input',   errors.name);
    if (errors.amount) showFieldError('amount-input', errors.amount);
    return;
  }

  const name     = document.getElementById('name-input').value.trim();
  const amount   = document.getElementById('amount-input').value;
  const category = document.getElementById('category-select').value;

  addTransaction(name, amount, category);
  resetForm();
}

/**
 * resetForm()
 * Resets the transaction form to its default state and removes any
 * inline field error messages left over from the previous submission.
 *
 * Requirements: 1.4
 */
function resetForm() {
  const form = document.getElementById('transaction-form');
  if (form) {
    form.reset();
  }
  clearFieldErrors();
}

// (submit event wired inside DOMContentLoaded — see Task 11 below)

// ============================================================
// TASK 9 — DELETE TRANSACTION FLOW
// (deleteTransaction, handleDeleteClick)
// ============================================================

/**
 * deleteTransaction(index)
 * Removes the transaction at the given index from the in-memory
 * `transactions` array, persists the updated array to localStorage,
 * then refreshes all affected UI regions.
 *
 * Requirements: 2.6, 2.7, 5.2
 *
 * @param {number} index - The zero-based index of the transaction to remove.
 */
function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveToStorage(transactions);
  renderTransactionList();
  renderBalance();
  updateChart();
}

/**
 * handleDeleteClick(event)
 * Event delegation handler attached to #transaction-list. Checks whether
 * the clicked element carries a `data-index` attribute (i.e. is a delete
 * button) and, if so, calls deleteTransaction with the parsed index.
 *
 * Requirements: 2.6, 2.7
 *
 * @param {Event} event - The click event bubbled up from a child element.
 */
function handleDeleteClick(event) {
  if (event.target.dataset.index !== undefined) {
    deleteTransaction(parseInt(event.target.dataset.index));
  }
}

// (click event wired inside DOMContentLoaded — see Task 11 below)

// ============================================================
// TASK 10 — ERROR DISPLAY BANNERS
// (showStorageError, showCorruptDataError)
// ============================================================

/**
 * showStorageError()
 * Renders a dismissible error banner at the top of the page when
 * localStorage.setItem fails (e.g. QuotaExceededError).
 *
 * The banner is prepended to document.body so it appears above all
 * other content.  The × close button removes the element from the DOM.
 *
 * Requirements: 5.5
 */
function showStorageError() {
  const banner = document.createElement('div');
  banner.setAttribute('role', 'alert');
  banner.className = 'banner banner--error';

  const message = document.createElement('span');
  message.textContent = 'Could not save data — storage quota exceeded.';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'banner__close';
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', function () {
    banner.remove();
  });

  banner.appendChild(message);
  banner.appendChild(closeBtn);
  document.body.prepend(banner);
}

/**
 * showCorruptDataError()
 * Renders a dismissible error banner at the top of the page when
 * corrupt or invalid data is found in localStorage and cleared.
 *
 * The banner is prepended to document.body so it appears above all
 * other content.  The × close button removes the element from the DOM.
 *
 * Requirements: 5.4
 */
function showCorruptDataError() {
  const banner = document.createElement('div');
  banner.setAttribute('role', 'alert');
  banner.className = 'banner banner--error';

  const message = document.createElement('span');
  message.textContent = 'Saved data was corrupted and has been cleared.';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'banner__close';
  closeBtn.type = 'button';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', function () {
    banner.remove();
  });

  banner.appendChild(message);
  banner.appendChild(closeBtn);
  document.body.prepend(banner);
}

// ============================================================
// TASK 11 — APP INITIALISATION
// (initApp, DOMContentLoaded listener)
// ============================================================

/**
 * initApp()
 * Loads persisted data from localStorage and initialises all UI components.
 *
 * - On corrupt data  : calls showCorruptDataError(), then initialises all
 *                      components with an empty array so the app is still usable.
 * - On success / first visit : sets the global `transactions` array and
 *                      renders the transaction list, balance, and chart.
 *
 * Must be called AFTER initChart() so that updateChart() has a valid
 * Chart.js instance to work with.
 *
 * Requirements: 2.4, 5.3, 5.4
 */
function initApp() {
  const result = loadFromStorage();

  if (result && result.error === true) {
    // Corrupt / invalid data was found and already cleared by loadFromStorage.
    showCorruptDataError();
    transactions = [];
  } else {
    transactions = result; // [] on first visit, or the restored array
  }

  renderTransactionList();
  renderBalance();
  updateChart();
}

// ============================================================
// TASK 11.2 — DOM READY BOOTSTRAP
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  // initChart MUST run before initApp because updateChart() needs
  // the Chart.js instance that initChart() creates.
  initChart();
  initApp();

  // Wire the submit event for the expense form.
  document.getElementById('transaction-form')
    .addEventListener('submit', handleFormSubmit);

  // Wire the delegated click handler for delete buttons in the list.
  document.getElementById('transaction-list')
    .addEventListener('click', handleDeleteClick);
});
