import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import appData from '../../korean/data/app-data.json';
import {
  entries,
  findEntry,
  installStaticDataForTests,
  isFull,
} from './data.js';
import {
  configureDataLoaderForTest,
  dataState,
  ensureSection,
  loadBoot,
} from './dataLoader.js';

const manifest = {
  files: {
    core: 'app-core.test.json',
    index: 'app-index.test.json',
    words: 'app-words.test.json',
    expressions: 'app-expressions.test.json',
    extended: 'app-extended.test.json',
  },
};

const core = {
  course: { chapters: [{ id: 'chapter-test', number: 1, title: 'Test', curriculumOrder: 1 }] },
  grammar: { grammarItems: [], endingItems: [] },
  activities: { chapterActivities: [] },
  guide: { tracks: [] },
  dialogues: { dialogues: [] },
  conversations: { conversations: [] },
  newcomerVocab: [
    {
      id: 'core-expression-001',
      hangul: '안녕하세요',
      romanization: 'annyeonghaseyo',
      english: 'hello',
      level: 'A1',
      type: 'expression',
      partOfSpeech: 'phrase',
      topic: ['greeting'],
    },
  ],
  patterns: [],
  vocabPacks: [],
  readers: [],
  hanjaRoots: [],
};

const index = {
  entries: [
    {
      id: 'word-test-001',
      hangul: '가다',
      romanization: 'gada',
      english: 'to go',
      level: 'A1',
      type: 'word',
      partOfSpeech: 'verb',
      topic: ['movement'],
      section: 'words',
    },
    {
      id: 'core-expression-001',
      hangul: '안녕하세요',
      romanization: 'annyeonghaseyo',
      english: 'hello',
      level: 'A1',
      type: 'expression',
      partOfSpeech: 'phrase',
      topic: ['greeting'],
      section: 'core',
    },
  ],
};

const words = {
  entries: [
    {
      id: 'word-test-001',
      hangul: '가다',
      romanization: 'gada',
      english: 'to go',
      level: 'A1',
      type: 'word',
      partOfSpeech: 'verb',
      topic: ['movement'],
      section: 'words',
      forms: { politePresent: '가요' },
      examples: [{ ko: '학교에 가요.', romanization: 'hakgyoe gayo.', en: 'I go to school.' }],
    },
  ],
};

function responseOk(body) {
  return {
    ok: true,
    status: 200,
    async json() {
      return body;
    },
  };
}

function makeFetch(fixtures, failOnce = new Set()) {
  const calls = [];
  const fetchImpl = vi.fn(async (url) => {
    const key = String(url).split('/').pop();
    calls.push(key);
    if (failOnce.has(key)) {
      failOnce.delete(key);
      throw new Error(`temporary failure for ${key}`);
    }
    if (!fixtures[key]) return { ok: false, status: 404, async json() { return {}; } };
    return responseOk(fixtures[key]);
  });
  fetchImpl.calls = calls;
  return fetchImpl;
}

describe('dataLoader', () => {
  beforeEach(() => {
    configureDataLoaderForTest({ reset: true });
  });

  afterEach(() => {
    configureDataLoaderForTest({ reset: true });
    installStaticDataForTests(appData);
  });

  it('loads boot core plus slim index before hydrating sections', async () => {
    const fetchImpl = makeFetch({
      'manifest.json': manifest,
      'app-core.test.json': core,
      'app-index.test.json': index,
      'app-words.test.json': words,
    });
    configureDataLoaderForTest({ base: '/korean-core-starter/data/', fetchImpl });

    await loadBoot();

    expect(get(dataState).core).toBe(true);
    expect(new Set(entries.map((entry) => entry.id))).toEqual(new Set(['word-test-001', 'core-expression-001']));
    expect(isFull(findEntry('word-test-001'))).toBe(false);
    expect(isFull(findEntry('core-expression-001'))).toBe(true);

    await ensureSection('words');

    expect(entries).toHaveLength(2);
    expect(findEntry('word-test-001')?.forms?.politePresent).toBe('가요');
    expect(isFull(findEntry('word-test-001'))).toBe(true);
  });

  it('deduplicates section requests and retries a transient fetch failure once', async () => {
    const fetchImpl = makeFetch(
      {
        'manifest.json': manifest,
        'app-core.test.json': core,
        'app-index.test.json': index,
        'app-words.test.json': words,
      },
      new Set(['app-words.test.json']),
    );
    configureDataLoaderForTest({ base: '/korean-core-starter/data/', fetchImpl });

    await loadBoot();
    await Promise.all([ensureSection('words'), ensureSection('words')]);

    expect(fetchImpl.calls.filter((key) => key === 'app-words.test.json')).toHaveLength(2);
    expect(get(dataState).words).toBe(true);
  });

  it('surfaces boot failures so main can show a retry UI', async () => {
    const fetchImpl = makeFetch({});
    configureDataLoaderForTest({ base: '/korean-core-starter/data/', fetchImpl });

    await expect(loadBoot()).rejects.toThrow(/Failed to fetch data file/);
    expect(get(dataState).error).toBeTruthy();
  });
});
