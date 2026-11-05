# Sculpture portfolio

A responsive React + Vite artist portfolio built in response to the Chris Williams Art reference. It includes an artwork gallery with category filters, accessible artwork dialogs, an artist section, a process section, mobile navigation, and inquiry draft downloads.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

## Verify and build

```sh
npm test
npm run build
npm run preview
```

Browser tests use the Chromium executable at `/usr/bin/chromium`. Adjust `playwright.config.js` for other systems. Vite outputs the static site to `dist/`, which can be deployed to any static host.

## Content and functionality

- Edit artwork data in `src/main.jsx` and styling in `src/style.css`.
- Images in `public/art/` are original AI-generated demonstration sculpture images. They do not depict actual works by Chris Williams.
- The artist text, artwork titles, and descriptions are demonstration content, not verified artist information.
- The external reference could not be inspected because the cloud network policy blocked its domain. This is an initial independent portfolio concept, not a verified reproduction. Screenshots or access to the reference are needed to match its appearance and content.
- The contact form downloads a text file with the visitor's inquiry. It does not send an email, store messages on a server, or claim delivery. Connect a real form service before using it for public inquiries.
- Replace demonstration identity and content with approved information before public release. No publication or deployment is included.

## GitHub Pages deployment

The `main` branch contains source. The `gh-pages` branch contains the static website. Pushing to `main` runs `.github/workflows/deploy.yml` to rebuild and update `gh-pages`.

In repository **Settings → Pages**, select **Deploy from a branch**, then **gh-pages** and **/ (root)**. This requires repository administration access. The expected address is `https://ejaubashi.github.io/t008/` once GitHub Pages is enabled and its deployment completes.

To build for that address locally:

```sh
SITE_BASE_PATH=/t008/ npm run build
```
