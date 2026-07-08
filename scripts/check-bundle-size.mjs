#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST_DATA_DIR = join(process.cwd(), 'dist', 'data');
const TARGET_BYTES = 1_200_000;
const LIMIT_BYTES = 1_300_000;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function gzipBytes(path) {
  return gzipSync(readFileSync(path)).length;
}

const manifestPath = join(DIST_DATA_DIR, 'manifest.json');
const manifest = readJson(manifestPath);
const coreFile = manifest.files?.core;
const indexFile = manifest.files?.index;

if (!coreFile || !indexFile) {
  throw new Error('public data manifest must include files.core and files.index');
}

const coreGzip = gzipBytes(join(DIST_DATA_DIR, coreFile));
const indexGzip = gzipBytes(join(DIST_DATA_DIR, indexFile));
const bootGzip = coreGzip + indexGzip;
const targetStatus = bootGzip <= TARGET_BYTES ? 'PASS' : 'WARN';

console.log(`Boot data gzip: ${bootGzip} bytes (${targetStatus}; target ${TARGET_BYTES}, hard limit ${LIMIT_BYTES})`);
console.log(`  core:  ${coreGzip} bytes (${coreFile})`);
console.log(`  index: ${indexGzip} bytes (${indexFile})`);

if (bootGzip > LIMIT_BYTES) {
  console.error(`Boot data gzip exceeds hard limit: ${bootGzip} > ${LIMIT_BYTES}`);
  process.exit(1);
}
