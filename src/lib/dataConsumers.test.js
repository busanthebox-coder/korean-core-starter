import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

function sourceFiles(dir = SRC) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    const rel = relative(ROOT, path);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    if (!/\.(js|svelte)$/.test(name)) return [];
    if (/\.test\.js$/.test(name) || rel === 'src/test-setup.js') return [];
    return [path];
  });
}

describe('split data consumer guards', () => {
  it('rejects production app-data imports', () => {
    const offenders = sourceFiles()
      .map((path) => [relative(ROOT, path), readFileSync(path, 'utf8')])
      .filter(([, text]) => /app-data\.json|korean\/data/.test(text))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });

  it('keeps Svelte data consumers out of module-scope scripts', () => {
    const offenders = sourceFiles()
      .filter((path) => path.endsWith('.svelte'))
      .map((path) => [relative(ROOT, path), readFileSync(path, 'utf8')])
      .filter(([, text]) => /<script\s+[^>]*(context=["']module["']|module)/.test(text))
      .map(([path]) => path);

    expect(offenders).toEqual([]);
  });
});
