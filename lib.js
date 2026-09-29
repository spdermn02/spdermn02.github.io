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

function sortAndStrip(repos) {
  return repos
    .sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt))
    .map(({ fork, archived, ...repo }) => repo);
}

export function pickTopRepos(rawList, { exclude = FEATURED_REPO, limit = 6 } = {}) {
  if (!Array.isArray(rawList)) return null;
  const repos = rawList
    .map(normalizeRepo)
    .filter((r) => r && !r.fork && !r.archived && r.name !== exclude);
  return sortAndStrip(repos).slice(0, limit);
}

const TOUCHPORTAL_NAME = /^touchportal/i;

export function pickMoreRepos(rawList, topNames) {
  if (!Array.isArray(rawList)) return null;
  const exclude = new Set([FEATURED_REPO, ...topNames]);
  const repos = rawList
    .map(normalizeRepo)
    .filter((r) => r && !r.fork && !r.archived && !exclude.has(r.name) && TOUCHPORTAL_NAME.test(r.name));
  return sortAndStrip(repos);
}

export function formatCount(n) {
  return compact.format(n);
}

export function downloadsBadgeUrl(name) {
  if (typeof name !== 'string' || !SAFE_NAME.test(name)) return null;
  return `https://img.shields.io/github/downloads/${GITHUB_USER}/${encodeURIComponent(name)}/total?label=downloads&color=f5a524&labelColor=2a2e39&style=flat-square`;
}

export function releaseBadgeUrl(name) {
  if (typeof name !== 'string' || !SAFE_NAME.test(name)) return null;
  return `https://img.shields.io/github/v/release/${GITHUB_USER}/${encodeURIComponent(name)}?label=release&color=f5a524&labelColor=2a2e39&style=flat-square`;
}

export function sameRepos(a, b) {
  if (a.length !== b.length) return false;
  return a.every((repo, i) => {
    const other = b[i];
    return (
      repo.name === other.name &&
      repo.stars === other.stars &&
      repo.description === other.description &&
      repo.language === other.language &&
      repo.url === other.url
    );
  });
}

const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export function parseFeatured(json) {
  if (!json || json.name !== FEATURED_REPO || !Number.isFinite(json.stargazers_count)) return null;
  return { stars: json.stargazers_count, description: cleanString(json.description) };
}

export function parseDownloads(json) {
  const n = json?.downloads;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseVersion(json) {
  const v = json?.version;
  return typeof v === 'string' && SEMVER.test(v) ? v : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const LED_LABELS = {
  active: 'Updated within 90 days',
  recent: 'Updated this year',
  idle: 'Not updated in over a year',
};

export function ledState(pushedAt, now = Date.now()) {
  if (typeof pushedAt !== 'string') return 'idle';
  const then = Date.parse(pushedAt);
  if (Number.isNaN(then)) return 'idle';
  const days = (now - then) / DAY_MS;
  if (days <= 90) return 'active';
  if (days <= 365) return 'recent';
  return 'idle';
}

export function cycle(options, current) {
  const i = options.indexOf(current);
  return i === -1 ? options[0] : options[(i + 1) % options.length];
}

export function gaugeStep(value, step = 20) {
  const next = value + step;
  return next > 100 ? 0 : next;
}

export function drift(value, delta, min = 20, max = 90) {
  return Math.round(Math.min(max, Math.max(min, value + delta)));
}

export const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
];

const normKey = (key) => (key.length === 1 ? key.toLowerCase() : key);

export function konamiMatcher(sequence = KONAMI) {
  const seq = sequence.map(normKey);
  let buffer = [];
  return function push(key) {
    buffer.push(normKey(key));
    if (buffer.length > seq.length) buffer.shift();
    if (buffer.length === seq.length && buffer.every((k, i) => k === seq[i])) {
      buffer = [];
      return true;
    }
    return false;
  };
}

export function isSpooky(date = new Date(), search = '') {
  if (new URLSearchParams(search).has('spooky')) return true;
  return date.getMonth() === 9;
}

export function rapidClicks(count = 5, windowMs = 2000) {
  let clicks = [];
  return function click(now) {
    clicks = clicks.filter((t) => now - t <= windowMs);
    clicks.push(now);
    if (clicks.length >= count) {
      clicks = [];
      return true;
    }
    return false;
  };
}

export async function fetchJson(url, { timeoutMs = 5000, fetchImpl = globalThis.fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
