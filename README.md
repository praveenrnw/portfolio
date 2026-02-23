# Portfolio (Neo-Brutalism)

Modular vanilla JS portfolio scaffold using ES modules and Vite. Themeable (neo + future mario).

Quick start (no Node required):

Serve the folder as static files and open in the browser. Example using Python's simple server:

```bash
python3 -m http.server 5173
# then open http://localhost:5173
```

If you prefer Node/Vite for HMR during development, use the existing `package.json` scripts.

Project layout:

/src
  /core - theme manager + renderer
  /data - `portfolioData.js` (content only)
  /themes/neo - CSS + components
  main.js

Add new themes under `/src/themes` and call `themeManager.setTheme('mario')`.

To remove `node_modules` and avoid Node entirely, delete `node_modules/` and `package.json` (optional).
# Porfolio (placeholder)

This is a minimal placeholder README for the repository.

- Repository name originally created as `porfolio`.
- Contents: `index.html` (dummy).
