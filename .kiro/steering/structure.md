# Project Structure

```
project-root/
├── index.html          # Single HTML entry point; all sections defined here
├── css/
│   └── style.css       # Exactly one CSS file — do not add more
├── js/
│   └── app.js          # Exactly one JS file — do not add more
└── README.md
```

## Rules
- **One CSS file only** — all styles go in `css/style.css`
- **One JS file only** — all logic goes in `js/app.js`
- Do not create subdirectories under `css/` or `js/`
- Do not create additional HTML files; the app is fully contained in `index.html`

## Key UI Sections (in `index.html`)
1. **Balance Display** — top-level running total
2. **Input Form** — fields for name, amount, category + submit button
3. **Transaction List** — scrollable list of expense entries with per-row delete
4. **Chart** — Chart.js canvas for category pie chart

## JavaScript Responsibilities (`js/app.js`)
- Local Storage read/write for all transactions
- Form validation (name, amount range/format, category required)
- DOM manipulation for Transaction List and Balance Display
- Chart.js instance creation and update
- Error handling for corrupt storage data and storage quota failures

## Data Model
Each transaction stored in Local Storage as a JSON array of objects:
```json
[
  { "name": "string", "amount": 0.00, "category": "Food|Transport|Fun" }
]
```
