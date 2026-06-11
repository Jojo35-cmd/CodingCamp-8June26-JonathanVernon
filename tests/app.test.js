// Feature: expense-budget-visualizer — test suite setup

/**
 * Minimal test runner
 * -------------------
 * Tracks pass/fail counts and writes results to #test-output.
 * No external dependencies — works with the plain browser environment.
 */

(function () {
  'use strict';

  // ── Runner state ──────────────────────────────────────────────────────────
  let passed  = 0;
  let failed  = 0;
  const lines = [];   // collected result lines (HTML strings)

  /**
   * Assert a synchronous expectation.
   * @param {string}  label       - Human-readable test description.
   * @param {boolean} condition   - Must be truthy for the test to pass.
   * @param {string}  [detail]    - Optional extra info shown on failure.
   */
  function assert(label, condition, detail) {
    if (condition) {
      passed++;
      lines.push('<div class="test-pass">  ✓ ' + escHtml(label) + '</div>');
    } else {
      failed++;
      const extra = detail ? ' — ' + escHtml(String(detail)) : '';
      lines.push('<div class="test-fail">  ✗ ' + escHtml(label) + extra + '</div>');
    }
  }

  /**
   * Wrap a fast-check property assertion so failures are caught and recorded
   * without throwing (which would abort all subsequent tests).
   *
   * @param {string}   label - Test description.
   * @param {object}   prop  - A fast-check IProperty (from fc.property / fc.asyncProperty).
   * @param {object}   [params] - Optional fc.Parameters passed to fc.assert.
   */
  function fcAssert(label, prop, params) {
    try {
      fc.assert(prop, Object.assign({ numRuns: 100 }, params || {}));
      passed++;
      lines.push('<div class="test-pass">  ✓ ' + escHtml(label) + '</div>');
    } catch (err) {
      failed++;
      lines.push(
        '<div class="test-fail">  ✗ ' + escHtml(label) +
        ' — ' + escHtml(String(err.message || err)) + '</div>'
      );
    }
  }

  /** Start a named test suite block. */
  function suite(name) {
    lines.push('<div class="test-suite">' + escHtml(name) + '</div>');
  }

  /** Minimal HTML escaping to prevent XSS in test labels/messages. */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Write all collected results into #test-output. */
  function renderResults() {
    const out = document.getElementById('test-output');
    if (!out) return;

    const summaryClass = failed === 0 ? 'test-pass' : 'test-fail';
    const summary =
      '<div class="test-summary ' + summaryClass + '">' +
      'Results: ' + passed + ' passed, ' + failed + ' failed' +
      '</div>';

    out.innerHTML = '<h2>Test Results</h2>' + lines.join('') + summary;
  }

  // ── Helpers to reset app state between tests ──────────────────────────────

  /**
   * Reset the app's in-memory transactions array to the given array and
   * clear localStorage so tests don't bleed state into each other.
   * Relies on `transactions` being accessible as a global (app.js does not
   * use modules, so all top-level vars are on window).
   */
  function resetState(arr) {
    localStorage.clear();
    // Directly mutate the global array so renderBalance / renderTransactionList
    // reflect our test state without triggering a full initApp() cycle.
    window.transactions.length = 0;
    if (Array.isArray(arr)) {
      arr.forEach(function (tx) { window.transactions.push(tx); });
    }
  }

  // ── Arbitraries ───────────────────────────────────────────────────────────

  // Valid category values as defined by the app.
  const arbCategory = fc.constantFrom('Food', 'Transport', 'Fun');

  // A valid transaction name: printable string, 1–100 chars after trimming.
  // We use fc.string with a restricted alphabet so the trimmed length is
  // always within [1, 100] without extra post-generation filtering.
  const arbValidName = fc.stringOf(
    fc.char().filter(function (c) { return c.trim().length > 0; }),
    { minLength: 1, maxLength: 100 }
  );

  // A valid amount: float with at most 2 decimal places, in [0.01, 999999999.99].
  const arbValidAmount = fc.integer({ min: 1, max: 99999999999 })
    .map(function (cents) { return cents / 100; });

  // A valid transaction object.
  const arbValidTransaction = fc.record({
    name:     arbValidName,
    amount:   arbValidAmount,
    category: arbCategory,
  });

  // ============================================================
  // TASK 12.1 — fast-check sanity check
  // ============================================================

  suite('Task 12.1 — fast-check setup verification');

  // Confirms that window.fc is loaded and fc.assert / fc.property work.
  fcAssert(
    'fast-check is loaded and fc.property works with fc.integer()',
    fc.property(fc.integer(), function (n) {
      return typeof n === 'number';
    })
  );

  assert(
    'window.fc is defined (UMD bundle loaded from CDN)',
    typeof window.fc !== 'undefined'
  );

  assert(
    'fc.assert is a function',
    typeof fc.assert === 'function'
  );

  assert(
    'fc.property is a function',
    typeof fc.property === 'function'
  );

  // ============================================================
  // TASK 12.1 — app global functions exist
  // Smoke-checks that app.js loaded and all expected globals are present.
  // ============================================================

  suite('Task 12.1 — app.js globals present');

  [
    'validateName', 'validateAmount', 'validateForm',
    'computeBalance', 'computeChartData',
    'addTransaction', 'deleteTransaction',
    'saveToStorage', 'loadFromStorage', 'clearStorage',
    'renderTransactionList', 'renderBalance',
    'initChart', 'updateChart',
    'resetForm', 'handleFormSubmit', 'handleDeleteClick',
    'showStorageError', 'showCorruptDataError',
  ].forEach(function (name) {
    assert('window.' + name + ' is a function', typeof window[name] === 'function');
  });

  // ============================================================
  // TASK 12.1 — window.Chart stub is in place
  // ============================================================

  suite('Task 12.1 — Chart.js stub');

  assert(
    'window.Chart is defined (stub injected before app.js)',
    typeof window.Chart === 'function'
  );

  assert(
    'chart global is non-null after initApp ran',
    window.chart !== null && window.chart !== undefined
  );

  // ============================================================
  // Stub locations for future property tests
  // (each comment marks where the corresponding task will add tests)
  // ============================================================

  // ============================================================
  // TASK 12.2 — Property 1: Name validation
  // ============================================================

  suite('Property 1 — Name validation (Requirements 1.1, 1.5)');

  // Feature: expense-budget-visualizer, Property 1: Name validation rejects whitespace and out-of-range inputs
  // Test A: any string whose trimmed length is in [1, 100] → validateName returns { valid: true }
  fcAssert(
    'validateName returns valid for any string with trimmed length in [1, 100]',
    fc.property(
      // Generate strings made only of non-whitespace chars so trimmed === raw, length in [1, 100]
      fc.stringOf(
        fc.char().filter(function (c) { return c.trim().length > 0; }),
        { minLength: 1, maxLength: 100 }
      ),
      function (name) {
        var result = validateName(name);
        return result.valid === true;
      }
    ),
    { numRuns: 100 }
  );

  // Feature: expense-budget-visualizer, Property 1: Name validation rejects whitespace and out-of-range inputs
  // Test B: any string with trimmed length 0 (whitespace-only or empty) → validateName returns { valid: false }
  fcAssert(
    'validateName returns invalid for any whitespace-only or empty string',
    fc.property(
      // Generate strings that are either empty or consist entirely of space characters
      fc.oneof(
        fc.constant(''),
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 })
      ),
      function (name) {
        var result = validateName(name);
        return result.valid === false;
      }
    ),
    { numRuns: 100 }
  );

  // Feature: expense-budget-visualizer, Property 1: Name validation rejects whitespace and out-of-range inputs
  // Test C: any string with trimmed length > 100 → validateName returns { valid: false }
  fcAssert(
    'validateName returns invalid for any string with trimmed length > 100',
    fc.property(
      // Generate strings of 101–200 non-whitespace chars so trimmed length is guaranteed > 100
      fc.stringOf(
        fc.char().filter(function (c) { return c.trim().length > 0; }),
        { minLength: 101, maxLength: 200 }
      ),
      function (name) {
        var result = validateName(name);
        return result.valid === false;
      }
    ),
    { numRuns: 100 }
  );

  // ============================================================
  // TASK 12.3 — Property 2: Amount validation
  // ============================================================

  suite('Property 2 — Amount validation (Requirements 1.1, 1.6)');

  // Feature: expense-budget-visualizer, Property 2: Amount validation rejects invalid numeric inputs
  // Test A: For any integer cents in [1, 99999999999] divided by 100, validateAmount returns { valid: true }
  fcAssert(
    'validateAmount returns valid for any amount with at most 2 decimal places in [0.01, 999999999.99]',
    fc.property(
      fc.integer({ min: 1, max: 99999999999 }),
      function (cents) {
        var amount = cents / 100;
        var result = validateAmount(amount);
        return result.valid === true;
      }
    ),
    { numRuns: 100 }
  );

  // Feature: expense-budget-visualizer, Property 2: Amount validation rejects invalid numeric inputs
  // Test B: For any value < 0.01, validateAmount returns { valid: false }
  fcAssert(
    'validateAmount returns invalid for any value less than 0.01',
    fc.property(
      fc.float({ max: 0.009, noNaN: true }),
      function (value) {
        var result = validateAmount(value);
        return result.valid === false;
      }
    ),
    { numRuns: 100 }
  );

  // Feature: expense-budget-visualizer, Property 2: Amount validation rejects invalid numeric inputs
  // Test C: For any value > 999999999.99, validateAmount returns { valid: false }
  fcAssert(
    'validateAmount returns invalid for any value greater than 999999999.99',
    fc.property(
      fc.integer({ min: 1, max: 999999999 }).map(function (n) { return 999999999.99 + n; }),
      function (value) {
        var result = validateAmount(value);
        return result.valid === false;
      }
    ),
    { numRuns: 100 }
  );

  // Feature: expense-budget-visualizer, Property 2: Amount validation rejects invalid numeric inputs
  // Test D: For non-numeric strings, validateAmount returns { valid: false }
  fcAssert(
    'validateAmount returns invalid for non-numeric strings',
    fc.property(
      fc.constantFrom('', 'abc', 'foo', 'NaN', 'undefined', 'null', '!@#', 'one', 'two point five'),
      function (value) {
        var result = validateAmount(value);
        return result.valid === false;
      }
    ),
    { numRuns: 100 }
  );

  // Feature: expense-budget-visualizer, Property 2: Amount validation rejects invalid numeric inputs
  // Test E: For amounts with more than 2 decimal places, validateAmount returns { valid: false }
  fcAssert(
    'validateAmount returns invalid for amounts with more than 2 decimal places',
    fc.property(
      // Generate integers in [101, 999999999] whose division by 1000 produces a string with 3 decimal digits
      fc.integer({ min: 101, max: 999999999 }).filter(function (n) { return n % 10 !== 0; }),
      function (n) {
        var value = (n / 1000).toString();
        var result = validateAmount(value);
        return result.valid === false;
      }
    ),
    { numRuns: 100 }
  );

  // Property 3 tests go here — Task 12.4
  // (Add transaction round-trip — in-memory array + localStorage)

  // Property 4 tests go here — Task 12.5
  // (Transaction list renders every entry correctly)

  // Property 5 tests go here — Task 12.6
  // (Delete integrity — removes exactly one, preserves all others)

  // Property 6 tests go here — Task 12.7
  // (Storage round-trip preserves data)

  // ============================================================
  // TASK 13.1 — Property 7: Balance computation
  // ============================================================

  suite('Property 7 — Balance computation (Requirements 3.1, 3.4)');

  // Feature: expense-budget-visualizer, Property 7: Balance equals sum of all transaction amounts
  // Test A: computeBalance([]) returns "$0.00"
  assert(
    'computeBalance([]) returns "$0.00"',
    computeBalance([]) === '$0.00'
  );

  // Feature: expense-budget-visualizer, Property 7: Balance equals sum of all transaction amounts
  // Test B: for any array of valid transactions, computeBalance returns a "$X.XX" formatted string
  fcAssert(
    'computeBalance returns a string matching "$X.XX" format for any valid transaction array',
    fc.property(
      fc.array(arbValidTransaction, { minLength: 0, maxLength: 20 }),
      function (arr) {
        var result = computeBalance(arr);
        // Must start with '$' and end with exactly 2 decimal digits
        return typeof result === 'string' &&
               result.charAt(0) === '$' &&
               /^\$\d+\.\d{2}$/.test(result);
      }
    ),
    { numRuns: 100 }
  );

  // Feature: expense-budget-visualizer, Property 7: Balance equals sum of all transaction amounts
  // Test C: numeric value of computeBalance equals integer-cent sum of all amounts
  fcAssert(
    'computeBalance numeric value equals integer-cent arithmetic sum of all amounts',
    fc.property(
      fc.array(arbValidTransaction, { minLength: 0, maxLength: 20 }),
      function (arr) {
        var expectedCents = arr.reduce(function (acc, tx) {
          return acc + Math.round(tx.amount * 100);
        }, 0);
        var expected = expectedCents / 100;
        var actual = parseFloat(computeBalance(arr).slice(1));
        return Math.abs(actual - expected) < 0.001;
      }
    ),
    { numRuns: 100 }
  );

  // Property 8 tests go here — Task 12.9
  // (Chart data is proportional to category sums)

  // Property 9 tests go here — Task 12.10
  // (Corrupt storage data is discarded gracefully)

  // ── Render results ────────────────────────────────────────────────────────
  renderResults();

}());
