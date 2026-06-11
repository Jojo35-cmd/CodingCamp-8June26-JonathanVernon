# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses by adding transactions with a name, amount, and category. It displays a running total balance and a pie chart showing spending distribution across categories. All data is persisted in the browser's Local Storage with no backend server required. The application is built with HTML, CSS, and Vanilla JavaScript only.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of a name, a monetary amount, and a category.
- **Transaction_List**: The scrollable UI component that displays all saved transactions.
- **Input_Form**: The HTML form through which the user enters a new transaction.
- **Balance_Display**: The UI element at the top of the page that shows the current total of all transaction amounts.
- **Chart**: The pie chart that visualises spending distribution by category.
- **Category**: One of three predefined labels — Food, Transport, or Fun — assigned to a transaction.
- **Local_Storage**: The browser's Web Storage API used to persist transaction data client-side.
- **Validator**: The client-side logic that checks whether all required form fields are filled before submission.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to fill in an input form with a transaction's name, amount, and category and submit it, so that the transaction is recorded and visible in my expense list.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for the item name accepting between 1 and 100 non-whitespace characters, a numeric field for the amount accepting values between 0.01 and 999,999,999.99 with up to 2 decimal places, and a dropdown selector with the options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields filled, THE App SHALL add the transaction to the Transaction_List.
3. WHEN the user submits the Input_Form with all fields filled, THE App SHALL persist the new transaction to Local_Storage.
4. WHEN the user submits the Input_Form with all fields filled, THE Input_Form SHALL reset all fields to their default empty/placeholder state.
5. IF the user submits the Input_Form with one or more fields empty or containing only whitespace, THEN THE Validator SHALL prevent submission and display an inline error message identifying each invalid field.
6. IF the user submits the Input_Form with an amount that is non-numeric, less than 0.01, greater than 999,999,999.99, or has more than 2 decimal places, THEN THE Validator SHALL prevent submission and display an inline error message on the amount field indicating the valid range and format.

---

### Requirement 2: View and Delete Transactions

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list and be able to remove individual ones, so that I can review and manage my expense history.

#### Acceptance Criteria

1. THE Transaction_List SHALL be visible at all times; IF no transactions have been saved, THEN THE Transaction_List SHALL display a placeholder message (e.g., "No transactions yet") instead of an empty container.
2. THE Transaction_List SHALL display every saved transaction showing its item name, amount formatted to two decimal places, and category.
3. THE Transaction_List SHALL be scrollable when the number of transactions exceeds the visible area.
4. WHEN transactions exist in Local_Storage on page load, THE App SHALL populate the Transaction_List with those transactions.
5. THE Transaction_List SHALL render each transaction row with a delete control uniquely associated with that transaction entry.
6. WHEN the user clicks the delete control for a transaction, THE App SHALL remove that transaction entry from the Transaction_List, leaving all other transaction entries unchanged.
7. WHEN the user clicks the delete control for a transaction, THE App SHALL remove that transaction entry from Local_Storage, leaving all other transaction entries unchanged.

---

### Requirement 3: Display Total Balance

**User Story:** As a user, I want to see my total expenditure at the top of the page and have it update in real time, so that I always know my current running total.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of the Amount fields of all transactions currently in the Transaction_List, formatted to two decimal places with a visible currency unit label (e.g., "$0.00").
2. WHEN a transaction is added, THE Balance_Display SHALL update to reflect the new total within 1 second without requiring a page reload.
3. WHEN a transaction is deleted, THE Balance_Display SHALL update to reflect the new total within 1 second without requiring a page reload.
4. WHEN no transactions exist, THE Balance_Display SHALL show a total of $0.00.

---

### Requirement 4: Visualise Spending by Category

**User Story:** As a user, I want a pie chart that breaks down my spending by category and updates automatically, so that I can understand how my money is distributed.

#### Acceptance Criteria

1. THE Chart SHALL render a pie chart where each category segment size equals (sum of that category's transaction amounts ÷ sum of all transaction amounts) × 100%.
2. WHEN a transaction is added, THE Chart SHALL update to reflect the new category distribution within the same render cycle, without requiring a page reload.
3. WHEN a transaction is deleted, THE Chart SHALL update to reflect the new category distribution within the same render cycle, without requiring a page reload.
4. WHEN no transactions exist, THE Chart SHALL render an empty pie chart with no segments.
5. IF a category has zero total spending, THEN THE Chart SHALL omit that category's segment entirely rather than displaying a zero-size segment.
6. THE App SHALL use Chart.js to render the pie chart; no alternative charting library SHALL be substituted while Chart.js is present and functional.

---

### Requirement 5: Data Persistence Across Sessions

**User Story:** As a user, I want my transaction data to be saved automatically in the browser, so that my records are still there when I reopen the page.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL write the updated transaction array to Local_Storage before the Transaction_List UI is updated.
2. WHEN a transaction is deleted, THE App SHALL write the updated transaction array to Local_Storage before the Transaction_List UI is updated.
3. WHEN the page is loaded, THE App SHALL read all transactions from Local_Storage and restore: the Transaction_List to show all previously saved transaction entries; the Balance_Display to reflect the sum of all restored transaction amounts; and the Chart to reflect the category distribution of all restored transactions.
4. WHEN the page is loaded and Local_Storage contains data that fails to parse as a valid JSON array or any entry is missing the required fields (name, amount, category), THEN THE App SHALL discard the corrupt data, clear Local_Storage, and initialise all components — Transaction_List, Balance_Display, and Chart — with their empty/zero states, and display a visible error indicator to the user.
5. IF a Local_Storage write operation fails (e.g., storage quota exceeded), THEN THE App SHALL display a visible error message to the user indicating that the data could not be saved.

---

### Requirement 6: Technology and Project Structure Constraints

**User Story:** As a developer, I want the codebase to follow a strict, minimal file structure using only standard web technologies, so that the project is easy to maintain and requires no build tools or server.

#### Acceptance Criteria

1. THE App SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no frontend frameworks (e.g., no React, Vue, or Angular).
2. THE App SHALL require no backend server; all logic and data storage SHALL be handled entirely in the browser.
3. THE App SHALL contain exactly one CSS file located inside a `css/` directory; this constraint SHALL be maintained even if doing so requires the use of CSS custom properties or feature queries for cross-browser compatibility.
4. THE App SHALL contain exactly one JavaScript file located inside a `js/` directory.
5. THE App SHALL function correctly in current stable versions of Chrome, Firefox, Edge, and Safari.
6. WHERE the App is packaged as a browser extension, THE App SHALL remain functional without modification to its core HTML, CSS, and JavaScript files.

---

### Requirement 7: Performance and Visual Design

**User Story:** As a user, I want the application to load quickly and present a clean, readable interface, so that I can use it without friction.

#### Acceptance Criteria

1. THE App SHALL load and become interactive — defined as all input fields enabled and no loading indicator visible — within 3 seconds on a connection with at least 25 Mbps download speed.
2. WHEN the user interacts with the Input_Form or Transaction_List, THE App SHALL update the visible state of the interacted element within 100 milliseconds.
3. THE App SHALL apply a clear visual hierarchy where each of the Balance_Display, Input_Form, Transaction_List, and Chart sections is in a visually distinct container with a heading or separator.
4. THE App SHALL use a minimum font size of 16px at default browser zoom and SHALL render without horizontal scrolling on viewports 320 px wide and above.
