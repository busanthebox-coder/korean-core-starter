import { get, writable } from 'svelte/store';
import { hydrateSection, installBootData, resetDataForTest, setSectionResolver } from './data.js';

const SECTION_NAMES = new Set(['words', 'expressions', 'extended']);

export const dataState = writable({
  core: false,
  words: false,
  expressions: false,
  extended: false,
  loading: false,
  error: null,
});

let manifestPromise = null;
let bootPromise = null;
const sectionPromises = new Map();
let testBase = '';
let testFetch = null;

function dataBase() {
  return testBase || `${import.meta.env.BASE_URL || '/'}data/`;
}

function joinDataUrl(file) {
  const base = dataBase();
  return `${base}${base.endsWith('/') ? '' : '/'}${file}`;
}

function fetchImpl() {
  return testFetch || globalThis.fetch;
}

async function readJsonFile(file, cache = 'force-cache') {
  const fetcher = fetchImpl();
  if (!fetcher) throw new Error('No fetch implementation available for data loading');
  const response = await fetcher(joinDataUrl(file), { cache });
  if (!response?.ok) {
    throw new Error(`Failed to fetch data file ${file}: HTTP ${response?.status || 'unknown'}`);
  }
  return response.json();
}

async function fetchJsonFile(file, cache) {
  try {
    return await readJsonFile(file, cache);
  } catch (firstError) {
    try {
      return await readJsonFile(file, cache);
    } catch (secondError) {
      secondError.cause = firstError;
      throw secondError;
    }
  }
}

async function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetchJsonFile('manifest.json', 'no-cache');
  }
  return manifestPromise;
}

async function loadNamedData(name) {
  const manifest = await loadManifest();
  const file = manifest.files?.[name];
  if (!file) throw new Error(`Missing data manifest entry for ${name}`);
  return fetchJsonFile(file);
}

function markError(error) {
  dataState.update((state) => ({ ...state, loading: false, error }));
}

export function configureDataLoaderForTest({ reset = false, base, fetchImpl: nextFetch } = {}) {
  if (reset) {
    manifestPromise = null;
    bootPromise = null;
    sectionPromises.clear();
    testBase = '';
    testFetch = null;
    resetDataForTest();
    dataState.set({ core: false, words: false, expressions: false, extended: false, loading: false, error: null });
  }
  if (base != null) testBase = base;
  if (nextFetch) testFetch = nextFetch;
}

export async function loadBoot() {
  if (bootPromise) return bootPromise;
  dataState.update((state) => ({ ...state, loading: true, error: null }));
  bootPromise = (async () => {
    const [core, index] = await Promise.all([loadNamedData('core'), loadNamedData('index')]);
    installBootData({ core, index });
    dataState.update((state) => ({ ...state, core: true, loading: false, error: null }));
    return { core, index };
  })().catch((error) => {
    bootPromise = null;
    markError(error);
    throw error;
  });
  return bootPromise;
}

export async function ensureSection(name) {
  if (name === 'core') return loadBoot();
  if (!SECTION_NAMES.has(name)) throw new Error(`Unknown data section: ${name}`);
  await loadBoot();
  if (get(dataState)?.[name]) return null;
  if (sectionPromises.has(name)) return sectionPromises.get(name);

  const promise = loadNamedData(name)
    .then((payload) => {
      hydrateSection(name, payload);
      dataState.update((state) => ({ ...state, [name]: true, error: null }));
      return payload;
    })
    .catch((error) => {
      sectionPromises.delete(name);
      markError(error);
      throw error;
    });
  sectionPromises.set(name, promise);
  return promise;
}

export function prefetchAll() {
  void ensureSection('words').catch((error) => console.warn('Word prefetch failed', error));
}

setSectionResolver(ensureSection);
