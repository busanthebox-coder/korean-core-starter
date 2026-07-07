#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildIdManifest,
  defaultDataDir,
  manifestPaths,
  verifyDataDir,
  writeIdManifest
} from './lib/integrity.mjs';

function parseArgs(argv) {
  const options = { dataDir: defaultDataDir(), updateManifest: false, writeIdManifest: false, selfTest: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--data-dir') options.dataDir = resolve(argv[++i]);
    else if (arg === '--update-manifest') options.updateManifest = true;
    else if (arg === '--write-id-manifest') options.writeIdManifest = true;
    else if (arg === '--self-test') options.selfTest = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function runSelfTest() {
  const manifest = buildIdManifest(defaultDataDir());
  const sections = Object.keys(manifest.sections);
  if (!sections.includes('extendedVocab')) throw new Error('self-test expected extendedVocab section');
  const keys = Object.keys(manifest.sections.extendedVocab);
  if (!keys.length) throw new Error('self-test expected extended vocabulary keys');
  return { ok: true, sections: sections.length, extendedKeys: keys.length };
}

try {
  const options = parseArgs(process.argv.slice(2));

  if (options.selfTest) {
    const result = runSelfTest();
    console.log(`integrity self-test passed: ${result.sections} sections, ${result.extendedKeys} extended keys`);
    process.exit(0);
  }

  if (options.writeIdManifest) {
    const manifest = buildIdManifest(options.dataDir);
    writeIdManifest(manifest);
    console.log(`Wrote ${manifestPaths().idManifest}`);
  }

  const result = verifyDataDir(options.dataDir, { updateManifest: options.updateManifest });
  const lines = [
    `Data integrity check: ${result.ok ? 'PASS' : 'FAIL'}`,
    `dataDir=${options.dataDir}`,
    `summary=${JSON.stringify(result.summary)}`
  ];
  for (const warning of result.warnings) lines.push(`WARN ${warning}`);
  for (const error of result.errors) lines.push(`ERROR ${error}`);
  const output = `${lines.join('\n')}\n`;
  writeFileSync(1, output);
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
