import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  displayName,
  safeRepoUrl,
  normalizeRepo,
  pickTopRepos,
  formatCount,
} from '../lib.js';

const raw = (overrides = {}) => ({
  name: 'TouchPortal_Example_Plugin',
  description: 'An example',
  stargazers_count: 10,
  language: 'JavaScript',
  html_url: 'https://github.com/spdermn02/TouchPortal_Example_Plugin',
  pushed_at: '2026-01-01T00:00:00Z',
  fork: false,
  archived: false,
  ...overrides,
});

test('displayName strips the TouchPortal prefix and separators', () => {
  assert.equal(displayName('TouchPortal_Discord_Plugin'), 'Discord Plugin');
  assert.equal(displayName('TouchPortal-HardwareMonitor'), 'HardwareMonitor');
  assert.equal(displayName('TouchPortal-KeyboardKeyCap-Icons-Grey'), 'KeyboardKeyCap Icons Grey');
  assert.equal(displayName('touchportal_lower_case'), 'lower case');
});

test('displayName keeps names without the prefix readable', () => {
  assert.equal(displayName('some-other_repo'), 'some other repo');
});

test('displayName falls back to the raw name when stripping leaves nothing', () => {
  assert.equal(displayName('TouchPortal'), 'TouchPortal');
  assert.equal(displayName('touchportal-'), 'touchportal-');
});

test('safeRepoUrl accepts github.com https URLs', () => {
  assert.equal(
    safeRepoUrl('https://github.com/spdermn02/Foo', 'Foo'),
    'https://github.com/spdermn02/Foo',
  );
});

test('safeRepoUrl falls back to a built URL for anything else', () => {
  const fallback = 'https://github.com/spdermn02/Foo';
  assert.equal(safeRepoUrl('javascript:alert(1)', 'Foo'), fallback);
  assert.equal(safeRepoUrl('https://github.com.evil.example/x', 'Foo'), fallback);
  assert.equal(safeRepoUrl('http://github.com/spdermn02/Foo', 'Foo'), fallback);
  assert.equal(safeRepoUrl(undefined, 'Foo'), fallback);
});

test('safeRepoUrl returns null when the URL is bad and the name is unsafe', () => {
  assert.equal(safeRepoUrl('javascript:alert(1)', '../evil'), null);
  assert.equal(safeRepoUrl(null, 42), null);
});

test('normalizeRepo maps GitHub fields', () => {
  assert.deepEqual(normalizeRepo(raw()), {
    name: 'TouchPortal_Example_Plugin',
    description: 'An example',
    stars: 10,
    language: 'JavaScript',
    url: 'https://github.com/spdermn02/TouchPortal_Example_Plugin',
    pushedAt: '2026-01-01T00:00:00Z',
    fork: false,
    archived: false,
  });
});

test('normalizeRepo nulls missing/blank description and language', () => {
  const r = normalizeRepo(raw({ description: null, language: null }));
  assert.equal(r.description, null);
  assert.equal(r.language, null);
  assert.equal(normalizeRepo(raw({ description: '   ' })).description, null);
});

test('normalizeRepo defaults bad star counts to 0 and bad pushed_at to empty', () => {
  const r = normalizeRepo(raw({ stargazers_count: 'lots', pushed_at: null }));
  assert.equal(r.stars, 0);
  assert.equal(r.pushedAt, '');
});

test('normalizeRepo rejects unsafe or missing names', () => {
  assert.equal(normalizeRepo(raw({ name: '../evil' })), null);
  assert.equal(normalizeRepo(raw({ name: 42 })), null);
  assert.equal(normalizeRepo(null), null);
  assert.equal(normalizeRepo('nope'), null);
});

test('pickTopRepos returns null for non-arrays (e.g. rate-limit error body)', () => {
  assert.equal(pickTopRepos({ message: 'API rate limit exceeded' }), null);
  assert.equal(pickTopRepos(null), null);
});

test('pickTopRepos returns [] for an empty array', () => {
  assert.deepEqual(pickTopRepos([]), []);
});

test('pickTopRepos excludes forks, archived, the featured repo, and invalid entries', () => {
  const result = pickTopRepos([
    raw({ name: 'Keep', stargazers_count: 1 }),
    raw({ name: 'Forked', stargazers_count: 100, fork: true }),
    raw({ name: 'Old', stargazers_count: 100, archived: true }),
    raw({ name: 'touchportal-node-api', stargazers_count: 100 }),
    raw({ name: '../bad', stargazers_count: 100 }),
  ]);
  assert.deepEqual(result.map((r) => r.name), ['Keep']);
});

test('pickTopRepos sorts by stars desc, ties by most recent push', () => {
  const result = pickTopRepos([
    raw({ name: 'Low', stargazers_count: 1 }),
    raw({ name: 'TieOld', stargazers_count: 5, pushed_at: '2024-01-01T00:00:00Z' }),
    raw({ name: 'High', stargazers_count: 9 }),
    raw({ name: 'TieNew', stargazers_count: 5, pushed_at: '2026-01-01T00:00:00Z' }),
  ]);
  assert.deepEqual(result.map((r) => r.name), ['High', 'TieNew', 'TieOld', 'Low']);
});

test('pickTopRepos limits results and strips fork/archived flags', () => {
  const many = Array.from({ length: 10 }, (_, i) =>
    raw({ name: `Repo${i}`, stargazers_count: i }));
  const result = pickTopRepos(many);
  assert.equal(result.length, 6);
  assert.equal(result[0].name, 'Repo9');
  assert.ok(!('fork' in result[0]) && !('archived' in result[0]));
  assert.equal(pickTopRepos(many, { limit: 2 }).length, 2);
});

test('pickTopRepos returns fewer than the limit when not enough are eligible', () => {
  assert.equal(pickTopRepos([raw({ name: 'A' }), raw({ name: 'B' })]).length, 2);
});

test('formatCount compacts large numbers', () => {
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(999), '999');
  assert.equal(formatCount(1000), '1K');
  assert.equal(formatCount(1234), '1.2K');
});
