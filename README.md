# spdermn02.github.io

Personal homepage for spdermn02: Touch Portal plugins & tools, plus the
[Touch Portal Node API](https://github.com/spdermn02/touchportal-node-api).
Live at <https://spdermn02.github.io>.

Static HTML/CSS/JS with no build step and no dependencies. Repo stats load live from the GitHub
and npm APIs. Repo cards show shields.io downloads/release badges, a status LED for how recently
each repo was pushed, a "More for Touch Portal" list rounds out the rest of the plugins below the
grid, a small demo deck lets you press some buttons and see what the plugins actually do (and a
few secrets), and there's a Ko-fi link in the header and footer for anyone who wants to chip in.
`snapshot.js` renders first and stays in place for any request that fails (e.g. GitHub's 60 req/hr
unauthenticated rate limit).

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
| `app.js` | Rendering + live data fetches (renders the page) |
| `lib.js` | Pure helpers: repo filtering, name formatting, response parsing, fetch timeout |
| `snapshot.js` | Fallback data rendered before live data arrives |
| `fun.js` | Demo deck + Konami easter egg |
| `seasonal.js` | October spooky mode (preview any time with `?spooky`) |
| `tests/` | Unit tests for `lib.js` and `snapshot.js` |
| `favicon.svg` | Tab icon |
| `404.html` | Not-found page (GitHub Pages serves it for any missing path) |
| `404.js` | 404 "map this button" |
| `tools/og-card.html` | Source for the social share image |
| `og.png` | Social share image |
| `package.json` | `test` / `serve` scripts only, no dependencies |
| `.nojekyll` | Serve files as-is (skip Jekyll) |
| `docs/superpowers/` | Design spec and implementation plan (also served publicly by Pages) |

## Refreshing the snapshot

`snapshot.js` renders first and is the fallback when the APIs fail. The page corrects star counts,
the top 6 and the More list live, but refresh the snapshot now and then. **`released` is the one
list that never updates itself**: it decides which repos get downloads/release badges, so a plugin
that ships its first stable release won't get badges until you add it here.

Top 6 (`SNAPSHOT.repos`) and More list (`SNAPSHOT.more`):

```bash
gh api 'users/spdermn02/repos?per_page=100&type=owner' | jq '[.[]
  | select(.fork == false and .archived == false and .name != "touchportal-node-api")]
  | sort_by(.stargazers_count, .pushed_at) | reverse
  | {repos: .[:6], more: (.[6:] | map(select(.name | test("^touchportal"; "i"))))}
  | map_values(map({name, description, stars: .stargazers_count, language, url: .html_url, pushedAt: .pushed_at}))'
```

Repos with at least one **stable** release (`SNAPSHOT.released`). Pre-releases don't count
because the shields release badge ignores them and would show "no releases found":

```bash
gh api 'users/spdermn02/repos?per_page=100&type=owner' \
  --jq '.[] | select(.fork == false and .archived == false and (.name | test("^touchportal"; "i")) and .name != "touchportal-node-api") | .name' |
  while read -r r; do
    gh api "repos/spdermn02/$r/releases?per_page=100" \
      --jq "if any(.[]; .draft == false and .prerelease == false) then \"$r\" else empty end"
  done
```

Paste the results into `SNAPSHOT.repos`, `SNAPSHOT.more` and `SNAPSHOT.released`, update
`featured.stars`, `npm.downloads`, `npm.version` and `date`, then run `npm test`.

## Share image

To refresh `og.png`: edit `tools/og-card.html`, serve the repo locally (`npm run serve`), then
screenshot the page at a 1200×630 viewport and save the result over `og.png` at the repo root.
