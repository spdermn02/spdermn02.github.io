# spdermn02.github.io

Personal homepage for spdermn02: Touch Portal plugins & tools, plus the
[Touch Portal Node API](https://github.com/spdermn02/touchportal-node-api).
Live at <https://spdermn02.github.io>.

Static HTML/CSS/JS with no build step and no dependencies. Repo stats load live from the GitHub
and npm APIs. Repo cards show a shields.io release-downloads badge. `snapshot.js` renders first
and stays in place for any request that fails (e.g. GitHub's 60 req/hr unauthenticated rate limit).

## Run locally

```bash
npm run serve   # python3 -m http.server 8000 → http://localhost:8000
```

ES modules don't load over `file://`, so use a server.

## Test

```bash
npm test        # node:test, Node 18+
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup, CSP, meta tags |
| `styles.css` | Theme tokens, layout, dark/light |
| `app.js` | Rendering + live data fetches (only file touching the DOM) |
| `lib.js` | Pure helpers: repo filtering, name formatting, response parsing, fetch timeout |
| `snapshot.js` | Fallback data rendered before live data arrives |
| `tests/` | Unit tests for `lib.js` and `snapshot.js` |
| `favicon.svg` | Tab icon |
| `package.json` | `test` / `serve` scripts only, no dependencies |
| `.nojekyll` | Serve files as-is (skip Jekyll) |
| `docs/superpowers/` | Design spec and implementation plan (also served publicly by Pages) |

## Refreshing the snapshot

Star counts in `snapshot.js` drift over time. The page corrects them live, but refresh the snapshot
now and then:

```bash
gh api 'users/spdermn02/repos?per_page=100&type=owner' | jq '[.[]
  | select(.fork == false and .archived == false and .name != "touchportal-node-api")]
  | sort_by(.stargazers_count, .pushed_at) | reverse | .[:6]
  | map({name, description, stars: .stargazers_count, language, url: .html_url, pushedAt: .pushed_at})'
```

Paste the result into `SNAPSHOT.repos`, update `featured.stars`, `npm.downloads`, `npm.version`,
and `date`, then run `npm test`.
