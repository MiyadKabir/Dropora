# Dropora

A browser-based file workspace. Drop files, organize them into folders, preview them, and download them — all client-side, no backend.

## Run it
Open `index.html` directly, or deploy the folder as-is to Netlify/Vercel (static site, no build step).

## Replace the logo
Swap `assets/dropora-logo.svg` with your real logo, keeping the same filename — every reference (intro, sidebar, mobile bar) updates automatically.

## Structure
```
Dropora/
├── index.html
├── css/style.css        (tokens, both themes, layout, components)
├── css/responsive.css   (mobile/tablet breakpoints)
├── js/storage.js        (localStorage: theme, view, folders, settings)
├── js/ui.js             (toasts, modals, context menu, mobile drawer)
├── js/folders.js        (create/rename/delete folders)
├── js/preview.js        (preview modal by file type)
├── js/files.js          (file records, grid/list render, filter/search/actions)
├── js/app.js            (intro sequence, navigation, wiring)
└── assets/dropora-logo.svg
```

## What's implemented
Animated intro, dark/light/system theming (persisted), sidebar navigation, drag-and-drop upload, grid/list views (persisted), live search, type filters, folders with move/rename/delete, a preview modal for images/PDF/audio/video/text with a graceful "preview unavailable" fallback, multi-select with download/move/delete, toast notifications, a settings panel, a storage/workspace stats view, and a responsive mobile drawer layout.

## Known simplifications (flagged so nothing here surprises you)
- **No IndexedDB / no persistence across reloads:** file *contents* live in memory for the session only (this is what keeps the app dependency-free). Folder names and settings persist via localStorage; actual files don't survive a refresh. Wiring in IndexedDB later would only mean changing `files.js`'s `add`/`all` functions — nothing else depends on how files are stored.
- **No ZIP download:** "Download" on a multi-select triggers individual downloads rather than bundling into a .zip (that needed a CDN library, which adds a dependency point of failure inside the build budget for this pass).
- **No in-browser image resize/compress/convert tools:** the Quick Tools section from the spec wasn't built out in this pass.
- Icons are inline SVG (no external icon library), and the type filters count `document`/`archive` by extension rather than deep content inspection.

Happy to build out the ZIP download, image tools, or IndexedDB persistence as a follow-up — just say which one first.
