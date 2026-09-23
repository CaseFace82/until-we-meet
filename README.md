# Until We Meet

A private-feeling daily pregnancy journey built as a static Progressive Web App.

## App structure
- `index.html` — app shell
- `content.js` — daily content
- `app.js` — Today / Our Journey logic
- `styles.css` — visual design
- `manifest.json` — installable PWA metadata
- `sw.js` — offline/update handling
- `art/` — weekly header and Oliver artwork

## Artwork filenames
Weekly headers are `art/header-week-10.webp` through `art/header-week-41.webp`.

Oliver poses are `art/oliver-01.webp` through `art/oliver-12.webp`.

The app remains usable while artwork is being added: CSS supplies the header fallback and missing Oliver images do not affect the content.

## GitHub Pages
Designed for a GitHub Pages project site using relative paths. Keep Pages deployed from the repository root.

## Updating
Replace files in GitHub using the same filenames. The service worker uses a versioned cache and network-first requests so updates can propagate without permanently trapping an old app version.
