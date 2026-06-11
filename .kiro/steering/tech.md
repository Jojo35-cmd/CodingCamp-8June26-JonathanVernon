# Tech Stack

## Languages & Technologies
- **HTML5** — single `index.html` entry point
- **CSS3** — single stylesheet in `css/`, use CSS custom properties for theming
- **Vanilla JavaScript (ES6+)** — single script in `js/`, no transpilation
- **Chart.js** — loaded via CDN for pie chart rendering; do not swap for another library

## Constraints
- No frontend frameworks (React, Vue, Angular, etc.)
- No build tools, bundlers, or package managers
- No backend or server-side code
- No additional JS libraries beyond Chart.js

## Browser Support
Target current stable versions of: Chrome, Firefox, Edge, Safari

## Common Commands
There is no build step. Open `index.html` directly in a browser, or serve it with any static file server:

```bash
# Quick local server (Python)
python -m http.server 8080

# Quick local server (Node)
npx serve .
```

No compilation, no `npm install`, no test runner is configured.
