import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeatured, parseDownloads, parseVersion, fetchJson } from '../lib.js';
import { SNAPSHOT } from '../snapshot.js';

test('parseFeatured reads stars and description', () => {
  assert.deepEqual(
    parseFeatured({ name: 'touchportal-node-api', stargazers_count: 20, description: 'Node API' }),
    { stars: 20, description: 'Node API' },
  );
});

test('parseFeatured returns null description when missing', () => {
  assert.deepEqual(
    parseFeatured({ name: 'touchportal-node-api', stargazers_count: 20, description: null }),
    { stars: 20, description: null },
  );
});

test('parseFeatured rejects wrong repo, missing stars, or non-objects', () => {
  assert.equal(parseFeatured({ name: 'other', stargazers_count: 20 }), null);
  assert.equal(parseFeatured({ name: 'touchportal-node-api' }), null);
  assert.equal(parseFeatured({ message: 'Not Found' }), null);
  assert.equal(parseFeatured(null), null);
});

test('parseDownloads accepts non-negative numbers only', () => {
  assert.equal(parseDownloads({ downloads: 190 }), 190);
  assert.equal(parseDownloads({ downloads: 0 }), 0);
  assert.equal(parseDownloads({ error: 'package not found' }), null);
  assert.equal(parseDownloads({ downloads: -1 }), null);
  assert.equal(parseDownloads({ downloads: '190' }), null);
  assert.equal(parseDownloads(null), null);
});

test('parseVersion accepts semver strings only', () => {
  assert.equal(parseVersion({ version: '4.0.0' }), '4.0.0');
  assert.equal(parseVersion({ version: '4.1.0-beta.1' }), '4.1.0-beta.1');
  assert.equal(parseVersion({ version: '<b>4</b>' }), null);
  assert.equal(parseVersion({ version: 4 }), null);
  assert.equal(parseVersion(null), null);
});

const okFetch = (body) => async () => ({ ok: true, json: async () => body });

test('fetchJson returns parsed JSON on 2xx', async () => {
  assert.deepEqual(await fetchJson('u', { fetchImpl: okFetch({ a: 1 }) }), { a: 1 });
});

test('fetchJson returns null on non-2xx (e.g. 403 rate limit)', async () => {
  const fetchImpl = async () => ({ ok: false, status: 403, json: async () => ({ message: 'rate' }) });
  assert.equal(await fetchJson('u', { fetchImpl }), null);
});

test('fetchJson returns null on network error', async () => {
  const fetchImpl = async () => { throw new TypeError('Failed to fetch'); };
  assert.equal(await fetchJson('u', { fetchImpl }), null);
});

test('fetchJson returns null on invalid JSON', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => { throw new SyntaxError('bad'); } });
  assert.equal(await fetchJson('u', { fetchImpl }), null);
});

test('fetchJson aborts and returns null after the timeout', async () => {
  const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
  assert.equal(await fetchJson('u', { fetchImpl, timeoutMs: 20 }), null);
});

test('SNAPSHOT has the expected shape', () => {
  assert.match(SNAPSHOT.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(SNAPSHOT.repos.length, 6);
  for (const r of SNAPSHOT.repos) {
    assert.equal(typeof r.name, 'string');
    assert.ok(r.url.startsWith('https://github.com/spdermn02/'));
    assert.equal(typeof r.stars, 'number');
    assert.notEqual(r.name, 'touchportal-node-api');
  }
  assert.equal(typeof SNAPSHOT.featured.stars, 'number');
  assert.equal(typeof SNAPSHOT.featured.description, 'string');
  assert.equal(parseDownloads(SNAPSHOT.npm), SNAPSHOT.npm.downloads);
  assert.equal(parseVersion(SNAPSHOT.npm), SNAPSHOT.npm.version);
});
