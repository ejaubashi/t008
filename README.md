# Chris Williams Art Gallery

A React + Vite reconstruction of the painting gallery shown in the user's two supplied screen recordings. The previous sculpture portfolio has been replaced.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

## Validate

```sh
npm test
npm run build
```

Browser tests use `/usr/bin/chromium` in this cloud environment. Update `playwright.config.js` for another system.

The tests exercise field rendering, scrolling and dragging, keyboard controls, artwork routes, list previews, previous-view restoration, contacts, sound controls, responsive layouts, and artwork asset responses.

## Structure

- `src/Field.jsx`: draggable Canvas artwork field, inertial movement, edge distortion, pointer ripple, and accessible artwork links.
- `src/main.jsx`: route navigation, index and horizontal artwork browsing, about, contacts, painting details, sound and cursor.
- `src/data.js`: observed artwork titles, artist text, field coordinates, timeline, and base-aware asset URLs.
- `src/style.css`: grid, responsive page layouts, locally hosted font, transitions, navigation, and reference badges.
- `public/paintings/`: 15 painting images extracted from the supplied recordings.
- `docs/reference-review.md`: frame analysis, observed behavior, asset provenance, and known gaps.

The recordings reveal 27 work titles, but do not show the actual images for works 07–18. Those images are explicitly unavailable, not replaced with generated content. The field effects, typeface, soundtrack, mobile layouts, and content outside the recordings cannot be represented as exact original source reproductions. See the reference review for details.

## GitHub Pages

The `main` branch contains source. `.github/workflows/deploy.yml` builds and deploys using the official GitHub Pages artifact workflow. Repository Settings → Pages must use **GitHub Actions** as the source.

Expected deployment address: `https://ejaubashi.github.io/t008/`.

```sh
SITE_BASE_PATH=/t008/ npm run build
SITE_BASE_PATH=/t008/ npm run preview
```

All asset paths and local fonts support the `/t008/` subdirectory. Hash routes also support direct links and reloads, for example `/t008/#/about`.
