import { SNAPSHOT } from './snapshot.js';
import {
  GITHUB_USER,
  FEATURED_REPO,
  displayName,
  formatCount,
  pickTopRepos,
  pickMoreRepos,
  parseFeatured,
  parseDownloads,
  parseVersion,
  fetchJson,
  sameRepos,
  downloadsBadgeUrl,
  releaseBadgeUrl,
} from './lib.js';

// All API-derived text goes through textContent; never parse HTML strings here.

const API = {
  repos: `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=owner`,
  featured: `https://api.github.com/repos/${GITHUB_USER}/${FEATURED_REPO}`,
  downloads: 'https://api.npmjs.org/downloads/point/last-month/touchportal-api',
  version: 'https://registry.npmjs.org/touchportal-api/latest',
};

const $ = (id) => document.getElementById(id);
const released = new Set(SNAPSHOT.released);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function stat(icon, value, label) {
  const wrap = el('span', 'stat');
  const glyph = el('span', 'stat-icon', icon);
  glyph.setAttribute('aria-hidden', 'true');
  wrap.append(glyph, el('span', null, value), el('span', 'sr-only', ` ${label}`));
  return wrap;
}

function badge(url, alt) {
  const img = document.createElement('img');
  img.className = 'deck-badge';
  img.src = url;
  img.alt = alt;
  img.height = 20;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('error', () => img.remove());
  return img;
}

function badges(repo) {
  if (!released.has(repo.name)) return null;
  const wrap = el('span', 'deck-badges');
  const downloadsUrl = downloadsBadgeUrl(repo.name);
  if (downloadsUrl) wrap.append(badge(downloadsUrl, 'downloads'));
  const releaseUrl = releaseBadgeUrl(repo.name);
  if (releaseUrl) wrap.append(badge(releaseUrl, 'latest release'));
  return wrap;
}

function repoCard(repo) {
  const card = el('a', 'deck-card');
  card.href = repo.url;
  card.rel = 'noopener';
  card.append(el('h3', 'deck-title', displayName(repo.name)), el('code', 'deck-raw', repo.name));
  if (repo.description) card.append(el('p', 'deck-desc', repo.description));
  const meta = el('div', 'deck-meta');
  meta.append(stat('★', formatCount(repo.stars), 'stars'));
  if (repo.language) meta.append(el('span', 'deck-lang', repo.language));
  const b = badges(repo);
  if (b) meta.append(b);
  card.append(meta);
  return card;
}

function moreRow(repo) {
  const row = el('a', 'more-row');
  row.href = repo.url;
  row.rel = 'noopener';
  row.append(el('span', 'more-name', displayName(repo.name)));
  if (repo.description) row.append(el('span', 'more-desc', repo.description));
  const b = badges(repo);
  if (b) row.append(b);
  return row;
}

let shownMore = null;

function renderMore(repos) {
  shownMore = repos;
  $('more-list').replaceChildren(...repos.map((repo) => {
    const li = document.createElement('li');
    li.append(moreRow(repo));
    return li;
  }));
  $('more').hidden = repos.length === 0;
}

let shownRepos = null;

function renderRepos(repos) {
  shownRepos = repos;
  $('repo-grid').replaceChildren(...repos.map(repoCard));
}

function renderFeatured({ stars, description }) {
  $('featured-desc').textContent = description ?? SNAPSHOT.featured.description;
  $('featured-stars').replaceChildren(stat('★', formatCount(stars), 'stars on GitHub'));
}

function renderDownloads(count) {
  $('featured-downloads').replaceChildren(
    stat('⬇', `${formatCount(count)}/mo`, 'npm downloads'));
}

function renderVersion(version) {
  $('featured-version').textContent = `v${version}`;
}

function renderDataNote(live) {
  $('data-note').textContent = live
    ? 'Stats live from GitHub & npm'
    : `Stats as of ${SNAPSHOT.date}`;
}

function setupCopy() {
  const button = $('copy-btn');
  if (!navigator.clipboard?.writeText) return;
  const command = $('install-cmd').textContent;
  let resetTimer;
  button.hidden = false;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(command);
      button.textContent = 'Copied';
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { button.textContent = 'Copy'; }, 1500);
    } catch {
      button.hidden = true;
    }
  });
}

function loadLive() {
  fetchJson(API.repos).then((json) => {
    const repos = pickTopRepos(json);
    if (repos?.length) {
      if (!sameRepos(repos, shownRepos)) renderRepos(repos);
      renderDataNote(true);
      const more = pickMoreRepos(json, repos.map((r) => r.name));
      if (Array.isArray(more) && !sameRepos(more, shownMore)) renderMore(more);
    }
  });
  fetchJson(API.featured).then((json) => {
    const featured = parseFeatured(json);
    if (featured) renderFeatured(featured);
  });
  fetchJson(API.downloads).then((json) => {
    const downloads = parseDownloads(json);
    if (downloads !== null) renderDownloads(downloads);
  });
  fetchJson(API.version).then((json) => {
    const version = parseVersion(json);
    if (version) renderVersion(version);
  });
}

renderRepos(SNAPSHOT.repos);
renderMore(SNAPSHOT.more);
renderFeatured(SNAPSHOT.featured);
renderDownloads(SNAPSHOT.npm.downloads);
renderVersion(SNAPSHOT.npm.version);
renderDataNote(false);
setupCopy();
loadLive();
