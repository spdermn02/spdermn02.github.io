import { SNAPSHOT } from './snapshot.js';
import {
  GITHUB_USER,
  FEATURED_REPO,
  displayName,
  formatCount,
  pickTopRepos,
  parseFeatured,
  parseDownloads,
  parseVersion,
  fetchJson,
  sameRepos,
  downloadsBadgeUrl,
} from './lib.js';

// All API-derived text goes through textContent; never parse HTML strings here.

const API = {
  repos: `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=owner`,
  featured: `https://api.github.com/repos/${GITHUB_USER}/${FEATURED_REPO}`,
  downloads: 'https://api.npmjs.org/downloads/point/last-month/touchportal-api',
  version: 'https://registry.npmjs.org/touchportal-api/latest',
};

const $ = (id) => document.getElementById(id);

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

function repoCard(repo) {
  const card = el('a', 'deck-card');
  card.href = repo.url;
  card.rel = 'noopener';
  card.append(el('h3', 'deck-title', displayName(repo.name)), el('code', 'deck-raw', repo.name));
  if (repo.description) card.append(el('p', 'deck-desc', repo.description));
  const meta = el('div', 'deck-meta');
  meta.append(stat('★', formatCount(repo.stars), 'stars'));
  if (repo.language) meta.append(el('span', 'deck-lang', repo.language));
  const badgeUrl = downloadsBadgeUrl(repo.name);
  if (badgeUrl) {
    const badge = document.createElement('img');
    badge.className = 'deck-badge';
    badge.src = badgeUrl;
    badge.alt = 'downloads';
    badge.height = 20;
    badge.loading = 'lazy';
    badge.decoding = 'async';
    badge.referrerPolicy = 'no-referrer';
    badge.addEventListener('error', () => badge.remove());
    meta.append(badge);
  }
  card.append(meta);
  return card;
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
renderFeatured(SNAPSHOT.featured);
renderDownloads(SNAPSHOT.npm.downloads);
renderVersion(SNAPSHOT.npm.version);
renderDataNote(false);
setupCopy();
loadLive();
