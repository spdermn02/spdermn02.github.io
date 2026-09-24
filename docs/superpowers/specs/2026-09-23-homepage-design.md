# spdermn02.github.io Homepage — Design

**Date:** 2026-09-23
**Status:** Approved; implemented (see the plan for the final file layout)

## Goal

A clean personal GitHub Pages homepage at `https://spdermn02.github.io` that showcases Jameson's
most-starred repositories and spotlights the Touch Portal Node API (`touchportal-node-api`).

## Audience

- Touch Portal users browsing for plugins.
- Developers who want to build Touch Portal plugins in Node.js.

## Constraints

- **Name:** first name "Jameson" only. The last name must not appear anywhere in the page source —
  visible text, `<title>`, meta/OG tags, alt text, or rendered API data. The GitHub profile `name`
  field (which includes the last name) is never read or rendered; "Jameson" is hardcoded. This spec
  and every other file in the repo is publicly served by Pages, so the last name must not appear in
  any committed file either.
- **Stack:** static HTML/CSS/JS, no framework, no build step, no Jekyll. Served from repo root on
  `main`.
- **External requests:** only `api.github.com`, `api.npmjs.org`, `registry.npmjs.org`,
  `avatars.githubusercontent.com`, `img.shields.io` (download badge images), and Google Fonts. No
  third-party JS.
- **Responsive:** works at 375px width with no horizontal scroll.
- **Themes:** dark by default; light when `prefers-color-scheme: light`.

## File Layout

```
index.html     markup, CSP, meta + Open Graph tags, font links
styles.css     design tokens, layout, dark/light themes, motion
app.js         DOM rendering, copy button, live fetches (only file touching the DOM)
lib.js         pure helpers: repo filtering/sorting, name formatting, URL safety, parsers, fetch timeout
snapshot.js    SNAPSHOT data rendered first and kept when a fetch fails
favicon.svg    tab icon
og.png         social share image (1200x630)
tools/         source for the share image (og-card.html)
package.json   test/serve scripts, no dependencies
tests/         node:test unit tests for lib.js and snapshot.js
.nojekyll      disable Jekyll processing
README.md      what the site is, local dev, snapshot refresh
```

## Page Sections

### 1. Header

- GitHub avatar (`https://avatars.githubusercontent.com/spdermn02`), round.
- "Jameson" as the display name; `@spdermn02` handle beneath.
- Tagline: "Touch Portal plugins & tools".
- GitHub profile link (icon button, inline SVG).
- Ko-fi support link (icon + label button, inline SVG), grouped with the GitHub link.

### 2. Featured: touchportal-node-api

Full-width card with accent border, visually distinct from the grid.

- Title: "Touch Portal Node API" with repo name `touchportal-node-api` as a subtitle.
- Description (from GitHub repo, fallback to snapshot).
- Install snippet: `npm install touchportal-api` in a monospace block with a copy button.
  - Copy uses `navigator.clipboard.writeText`; button shows "Copied" for ~1.5s.
  - If the Clipboard API is unavailable or rejects, the button is hidden (text remains selectable).
- Stats row: ★ stars (GitHub), ⬇ downloads last month (npm), latest version `vX.Y.Z` (npm).
- Link buttons:
  - **npm** → `https://www.npmjs.com/package/touchportal-api`
  - **GitHub** → `https://github.com/spdermn02/touchportal-node-api`
  - **Docs** → `https://github.com/spdermn02/touchportal-node-api#readme` (wiki is empty)

### 3. Top Repos Grid

- The 6 most-starred repos owned by spdermn02, **excluding** forks, archived repos, and
  `touchportal-node-api` (already featured). Ties broken by most recently pushed.
- Each card is an `<a>` to the repo `html_url`, styled like a rounded Touch Portal deck button.
- Card content:
  - Display name — derived from repo name: strip a leading `TouchPortal`/`touchportal` prefix and
    its separator (`_` or `-`), then replace remaining `_`/`-` with spaces.
    e.g. `TouchPortal_Discord_Plugin` → "Discord Plugin", `TouchPortal-HardwareMonitor` →
    "HardwareMonitor". If stripping leaves an empty string, use the raw repo name.
  - Raw repo name in small mono text (so it's still searchable/recognizable).
  - Description, clamped to 3 lines. Missing description → omitted.
  - ★ star count and primary language (omitted if null).
  - Release downloads badge (shields.io image; removed if it fails to load).
  - Latest-release badge (shields.io image; only for repos that ship GitHub releases, removed if
    it fails to load).
- Grid: 3 columns ≥ 900px, 2 columns ≥ 600px, 1 column below.

### 3b. More for Touch Portal

- A flat list (below the Top Repos grid) of the remaining `touchportal`-prefixed, non-fork,
  non-archived repos — i.e. everything eligible that didn't make the top-6 cut, plus
  `touchportal-node-api` excluded since it's already featured. Sorted the same way as the grid:
  stars desc, ties broken by most recent push. No limit — every qualifying repo gets a row.
  Section (and its heading) is hidden entirely when the list is empty.
- Each row links to the repo and shows its display name, description (omitted if null), and —
  only for repos that ship GitHub releases — the same downloads + release badges as the grid.

### 4. Footer

- "All repos on GitHub →" linking to `https://github.com/spdermn02?tab=repositories`.
- "Support on Ko-fi ☕" linking to `https://ko-fi.com/spdermn02`.
- Small muted note: "Stats live from GitHub & npm" (or "Stats as of <snapshot date>" when the
  live fetch failed).

## Data Flow

1. `snapshot.js` contains a `SNAPSHOT` object captured on 2026-09-23: top repos (name, description,
   stars, language, url, pushed_at), node-api stars/description, npm downloads (190/month), and
   npm version (4.0.0).
2. On `DOMContentLoaded`, render the page from `SNAPSHOT` immediately.
3. In parallel, fetch (with a 5s `AbortController` timeout each):
   - `GET https://api.github.com/users/spdermn02/repos?per_page=100&type=owner`
   - `GET https://api.github.com/repos/spdermn02/touchportal-node-api`
   - `GET https://api.npmjs.org/downloads/point/last-month/touchportal-api`
   - `GET https://registry.npmjs.org/touchportal-api/latest`
4. Each response that succeeds (HTTP 2xx, valid JSON, expected shape) replaces its slice of data and
   re-renders that section only. Failed requests leave the snapshot in place — failures are
   independent per request.
5. The footer note reflects whether the GitHub repos fetch succeeded.

`per_page=100` is sufficient: the account has 28 public repos. No pagination.

## Security

- All API-derived strings are inserted via `textContent` / `setAttribute`, never `innerHTML`.
- Link `href`s from the API (`html_url`) are only used if they start with
  `https://github.com/`; otherwise the card falls back to
  `https://github.com/spdermn02/<name>` built from a name matching `^[A-Za-z0-9._-]+$`.
- External links use `rel="noopener"`.
- No secrets or tokens — all endpoints are unauthenticated public reads.

## Visual Design

- **Theme tokens** on `:root`: background, surface, surface-raised, text, text-muted, border,
  accent. Dark values by default; light values under `@media (prefers-color-scheme: light)`.
- **Accent:** amber `#F5A524` (dark theme) / `#B45309` (light theme, for contrast), used for the
  featured card border, links, stat icons, and focus rings.
- **Type:** Google Fonts — Space Grotesk (display/body, weights 400/500/700) and JetBrains Mono
  (snippet, repo names, weight 400). System font fallbacks.
- **Deck-button cards:** large radius (~16px), raised surface, subtle inner highlight; on hover lift
  slightly, on `:active` press down (translate + shadow reduction). Disabled under
  `prefers-reduced-motion: reduce`.
- **Focus:** visible `:focus-visible` outline in the accent color on all interactive elements.
- Page max width ~1080px, 16px side gutter on mobile.

## Accessibility

- Semantic landmarks: `<header>`, `<main>`, `<section>` with headings, `<footer>`.
- Avatar has `alt="Jameson's avatar"`.
- Icon-only buttons have `aria-label`.
- Stat icons (★, ⬇) have accessible text (e.g. visually hidden "stars").
- Color contrast ≥ 4.5:1 for body text in both themes.

## Error Handling

| Failure | Behavior |
|---|---|
| GitHub repos fetch fails / rate-limited (403) / timeout | Grid stays on snapshot; footer shows snapshot date |
| node-api repo fetch fails | Featured stars/description stay on snapshot |
| npm downloads or registry fetch fails | That stat stays on snapshot value |
| JS disabled | `<noscript>` message with a link to the GitHub profile |
| Clipboard API unavailable | Copy button hidden |

## Testing

Unit tests (`npm test`) cover lib.js and the snapshot; the steps below are the browser checks.

1. Serve locally (`python3 -m http.server`) and verify:
   - Dark and light themes (toggle OS / devtools emulation).
   - 375px, 768px, and 1280px widths — no horizontal scroll, grid columns 1/2/3.
   - Copy button copies the exact install command.
2. Block `api.github.com` and `*.npmjs.org` in devtools → snapshot renders, footer shows snapshot
   date, no console errors besides the blocked requests.
3. A case-insensitive grep for the last name across all committed files returns nothing.
4. Keyboard-only pass: all links/buttons reachable, focus visible.
5. After push: enable Pages (source: `main`, `/`) if not already, confirm the live URL loads.

## Out of Scope

- Blog, contact form, analytics.
- Manual theme toggle (OS preference only).
- Custom domain.
