import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectPrecacheUrls } from './finalize-pwa.mjs';

describe('collectPrecacheUrls', () => {
  it('collects app shell, generated assets, split data, and icons', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kcs-pwa-'));
    try {
      mkdirSync(join(dir, 'assets'), { recursive: true });
      mkdirSync(join(dir, 'data'), { recursive: true });
      mkdirSync(join(dir, 'icons'), { recursive: true });
      writeFileSync(join(dir, 'index.html'), '');
      writeFileSync(join(dir, '404.html'), '');
      writeFileSync(join(dir, 'assets', 'App.abc.js'), '');
      writeFileSync(join(dir, 'data', 'manifest.json'), '');
      writeFileSync(join(dir, 'icons', 'icon-192.png'), '');
      writeFileSync(join(dir, 'ignore.txt'), '');

      expect(collectPrecacheUrls(dir)).toEqual([
        '.',
        '404.html',
        'assets/App.abc.js',
        'data/manifest.json',
        'icons/icon-192.png',
        'index.html',
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
