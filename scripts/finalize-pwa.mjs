import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function defaultDistDir() {
  return fileURLToPath(new URL('../dist/', import.meta.url));
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

export function collectPrecacheUrls(rootDir = defaultDistDir()) {
  const keep = new Set(['index.html', '404.html', 'favicon.svg', 'og.png', 'manifest.webmanifest']);
  const includeDirs = ['assets/', 'data/', 'icons/'];
  return ['.']
    .concat(
      walk(rootDir)
        .map((file) => relative(rootDir, file).split(sep).join('/'))
        .filter((file) => keep.has(file) || includeDirs.some((dir) => file.startsWith(dir)))
        .sort()
    );
}

function buildCacheVersion(urls, rootDir) {
  const hash = createHash('sha256');
  for (const url of urls) {
    const filePath = url === '.' ? join(rootDir, 'index.html') : join(rootDir, url);
    if (existsSync(filePath)) {
      const stat = statSync(filePath);
      hash.update(`${url}:${stat.size}:${stat.mtimeMs};`);
    }
  }
  return `kcs-pwa-${hash.digest('hex').slice(0, 12)}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const distDir = defaultDistDir();
  const swPath = join(distDir, 'sw.js');
  if (!existsSync(swPath)) throw new Error('dist/sw.js was not found; run vite build first.');
  const urls = collectPrecacheUrls();
  const source = readFileSync(swPath, 'utf8')
    .replace('__KCS_CACHE_VERSION__', buildCacheVersion(urls, distDir))
    .replace('__KCS_PRECACHE_MANIFEST__', JSON.stringify(urls, null, 2));
  writeFileSync(swPath, source);
  console.log(`Finalized PWA service worker with ${urls.length} precached URLs.`);
}
