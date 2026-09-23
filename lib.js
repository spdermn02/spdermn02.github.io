// Pure helpers: no DOM, no globals beyond fetch/AbortController. Imported by app.js and tests.

export const GITHUB_USER = 'spdermn02';
export const FEATURED_REPO = 'touchportal-node-api';

const SAFE_NAME = /^[A-Za-z0-9._-]+$/;
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function displayName(repoName) {
  const pretty = repoName.replace(/^touchportal[_-]?/i, '').replace(/[_-]+/g, ' ').trim();
  return pretty || repoName;
}

export function safeRepoUrl(htmlUrl, name) {
  if (typeof htmlUrl === 'string' && htmlUrl.startsWith('https://github.com/')) return htmlUrl;
  if (typeof name === 'string' && SAFE_NAME.test(name)) {
    return `https://github.com/${GITHUB_USER}/${name}`;
  }
  return null;
}

function cleanString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function normalizeRepo(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const { name } = raw;
  if (typeof name !== 'string' || !SAFE_NAME.test(name)) return null;
  return {
    name,
    description: cleanString(raw.description),
    stars: Number.isFinite(raw.stargazers_count) ? raw.stargazers_count : 0,
    language: cleanString(raw.language),
    url: safeRepoUrl(raw.html_url, name),
    pushedAt: typeof raw.pushed_at === 'string' ? raw.pushed_at : '',
    fork: raw.fork === true,
    archived: raw.archived === true,
  };
}

export function pickTopRepos(rawList, { exclude = FEATURED_REPO, limit = 6 } = {}) {
  if (!Array.isArray(rawList)) return null;
  return rawList
    .map(normalizeRepo)
    .filter((r) => r && !r.fork && !r.archived && r.name !== exclude)
    .sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt))
    .slice(0, limit)
    .map(({ fork, archived, ...repo }) => repo);
}

export function formatCount(n) {
  return compact.format(n);
}
