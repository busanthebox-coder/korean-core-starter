import { describe, it, expect, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import {
  entries,
  findEntry,
  chapters,
  dialogues,
  guideTracks,
  grammar,
  levels,
  vocabPacks,
  readers,
  findReader,
} from './data.js';

function copyRepoForPipelineTest(target) {
  const root = process.cwd();
  const skipped = ['.debug-journal.md', '.git', '.omo', '.svelte-kit', 'dist', 'node_modules'];
  cpSync(root, target, {
    recursive: true,
    filter(source) {
      const rel = relative(root, source);
      return !skipped.some((name) => rel === name || rel.startsWith(`${name}/`));
    }
  });
}

describe('data layer', () => {
  it('loads a large vocabulary pool', () => {
    expect(entries.length).toBeGreaterThanOrEqual(3768);
  });
  it('keeps generated app-data ids unique and extended ids well-formed', () => {
    const ids = entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    const malformedExtendedIds = entries
      .filter((entry) => entry.id.startsWith('word-ext-'))
      .filter((entry) => !/^word-ext-(\d{3,}|ch\d{2}-[a-z0-9-]+)$/.test(entry.id))
      .map((entry) => entry.id);
    expect(malformedExtendedIds).toEqual([]);
  });
  it('keeps grammar synchronized across generated app bundles', () => {
    const dataDir = join(process.cwd(), 'korean/data');
    const grammarFile = JSON.parse(readFileSync(join(dataDir, 'grammar.json'), 'utf8'));
    const appDataFile = JSON.parse(readFileSync(join(dataDir, 'app-data.json'), 'utf8'));
    const bundleText = readFileSync(join(process.cwd(), 'korean/data-bundle.js'), 'utf8');
    const bundleFile = JSON.parse(bundleText.replace(/^window\.KOREAN_CORE_DATA = /, '').replace(/;\s*$/, ''));

    expect(appDataFile.grammar).toEqual(grammarFile);
    expect(bundleFile.grammar).toEqual(grammarFile);
  });
  it('does not overwrite generated data when integrity fails', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'kcs-generate-failsafe-'));
    try {
      const repo = join(tmp, 'repo');
      copyRepoForPipelineTest(repo);
      const seedPath = join(repo, 'scripts/vocab-src/recovered-2026-07.json');
      const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
      writeFileSync(seedPath, `${JSON.stringify([
        ...seed.slice(1),
        {
          ...seed[0],
          hangul: '검증용 새 항목',
          english: 'temporary verification entry'
        }
      ], null, 2)}\n`, 'utf8');

      const vocabPath = join(repo, 'korean/data/vocab-extended.json');
      const idManifestPath = join(repo, 'scripts/id-manifest.json');
      const before = readFileSync(vocabPath, 'utf8');
      const manifestBefore = readFileSync(idManifestPath, 'utf8');
      const result = spawnSync(process.execPath, ['scripts/generate-korean-data.mjs'], {
        cwd: repo,
        encoding: 'utf8'
      });
      const after = readFileSync(vocabPath, 'utf8');
      const manifestAfter = readFileSync(idManifestPath, 'utf8');

      expect(result.status).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toContain('missing 1 expected entries');
      expect(after).toBe(before);
      expect(manifestAfter).toBe(manifestBefore);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 60000);
  it('findEntry resolves a known verb', () => {
    const e = findEntry('word-verb-001');
    expect(e).toBeTruthy();
    expect(e.hangul).toBeTypeOf('string');
  });
  it('every chapter cross-link resolves to an entry or grammar id', () => {
    const grammarIds = new Set(grammar.map((g) => g.id));
    const unresolved = [];
    for (const ch of chapters) {
      for (const id of [...(ch.linkedEntryIds || []), ...(ch.coreVocabularyIds || []), ...(ch.patternIds || [])]) {
        if (!findEntry(id)) unresolved.push(id);
      }
      for (const id of ch.grammarFocus || []) if (!grammarIds.has(id)) unresolved.push(id);
    }
    expect(unresolved).toEqual([]);
  });
  it('exposes dialogues and guide tracks', () => {
    expect(dialogues.length).toBeGreaterThanOrEqual(8);
    expect(guideTracks.length).toBeGreaterThanOrEqual(6);
    expect(guideTracks.some((track) => track.id === 'track-emergency-work')).toBe(true);
    expect(guideTracks.some((track) => track.id === 'track-life-apps')).toBe(true);
  });
  it('exposes the C0 and C9 A1 vocabulary packs with resolved entries', () => {
    expect(vocabPacks.map((pack) => pack.id)).toEqual([
      'pack-survival-basics',
      'pack-survival-help',
      'pack-numbers',
      'pack-family',
      'pack-body',
      'pack-time',
      'pack-people-places',
      'pack-home-things',
      'pack-food-basic',
      'pack-colors',
    ]);

    for (const pack of vocabPacks) {
      expect(pack.items.length, pack.id).toBeGreaterThanOrEqual(10);
      for (const item of pack.items) {
        expect(findEntry(item.entryId), `${pack.id}:${item.entryHangul}`).toBeTruthy();
        for (const relatedId of item.relatedEntryIds || []) {
          expect(findEntry(relatedId), `${pack.id}:${item.entryHangul}:related`).toBeTruthy();
        }
      }
    }
  });
  it('exposes the C6 Reading Room readers from app data', () => {
    expect(readers.length).toBe(20);
    expect(readers.filter((reader) => reader.level === 'A1')).toHaveLength(5);
    expect(readers.filter((reader) => reader.level === 'A2')).toHaveLength(5);
    expect(readers.filter((reader) => reader.level === 'B1')).toHaveLength(5);
    expect(readers.filter((reader) => reader.level === 'B2')).toHaveLength(5);

    const reader = findReader('reader-b2-19');
    expect(reader?.title).toBe('한국어 선생님 인터뷰');
    expect(reader?.comprehensionQuestions).toHaveLength(4);
    expect(reader?.body.join('\n')).not.toMatch(/[a-z]{3,}/i);
  });
  it('resolves ambiguous vocabulary pack headwords to the intended meaning', () => {
    const packById = Object.fromEntries(vocabPacks.map((pack) => [pack.id, pack]));
    const numberMeanings = Object.fromEntries(
      packById['pack-numbers'].items.map((item) => [item.entryHangul, item.entryEnglish]),
    );
    const bodyMeanings = Object.fromEntries(
      packById['pack-body'].items.map((item) => [item.entryHangul, item.entryEnglish]),
    );

    expect(numberMeanings['열']).toContain('ten');
    expect(numberMeanings['팔']).toContain('eight');
    expect(numberMeanings['천']).toContain('thousand');
    expect(numberMeanings['열']).not.toContain('fever');
    expect(numberMeanings['팔']).not.toContain('arm');
    expect(numberMeanings['천']).not.toContain('fabric');
    expect(bodyMeanings['눈']).toBe('eye');
    expect(bodyMeanings['팔']).toBe('arm');
    expect(bodyMeanings['다리']).toBe('leg');
  });
  it('keeps Numbers Starter arithmetic examples internally consistent', () => {
    const examples = [
      ['오', 'five (Sino number)', '오 더하기 오는 십이에요.', 'o deohagi oneun sibieyo.'],
      ['팔', 'eight (Sino number)', '팔 더하기 이는 십이에요.', 'pal deohagi ineun sibieyo.'],
      ['구', 'nine (Sino number)', '구 더하기 일은 십이에요.', 'gu deohagi ireun sibieyo.'],
    ];
    for (const [hangul, english, ko, romanization] of examples) {
      const example = entries.find((entry) => entry.hangul === hangul && entry.english === english)?.examples?.[0];
      expect(example?.ko).toBe(ko);
      expect(example?.romanization).toBe(romanization);
      expect(example?.ko).not.toContain('십이예요');
    }
  });
  it('fails loudly when generated vocab pack items reference missing entries', async () => {
    const generatedDataWithBadPackReference = {
      words: [{ id: 'word-known-001', hangul: '테스트', english: 'test', level: 'A1', sort: 1 }],
      newcomerVocab: [],
      extendedVocab: [],
      expressions: [],
      patterns: [],
      vocabPacks: [
        {
          id: 'pack-test',
          title: 'Test pack',
          items: [
            { entryId: 'word-known-001', entryHangul: '테스트' },
            { entryId: 'word-missing-001', entryHangul: '누락' },
          ],
        },
      ],
      course: { chapters: [], curriculumGuide: [], functionTags: [] },
      grammar: { grammarItems: [], endingItems: [] },
      activities: { chapterActivities: [] },
      guide: { tracks: [] },
      dialogues: { dialogues: [] },
      conversations: { conversations: [] },
    };

    vi.resetModules();
    vi.doMock('../../korean/data/app-data.json', () => ({
      default: generatedDataWithBadPackReference,
    }));
    try {
      await expect(import('./data.js?invalid-vocab-pack-reference')).rejects.toThrow(
        'Invalid vocab pack reference: pack-test -> word-missing-001',
      );
    } finally {
      vi.doUnmock('../../korean/data/app-data.json');
      vi.resetModules();
    }
  });
  it('adds the C9 day-one guide units and survival expressions', () => {
    const appManual = guideTracks.find((track) => track.id === 'track-app-manual');
    expect(appManual).toBeTruthy();
    expect((appManual.units || []).map((unit) => unit.id)).toEqual([
      'guide-app-how-to-use',
      'guide-app-korean-typing',
      'guide-app-how-korean-works',
    ]);

    for (const hangul of ['안녕하세요', '천천히 말해 주세요', '화장실이 어디예요?']) {
      const entry = entries.find((item) => item.hangul === hangul);
      expect(entry, hangul).toBeTruthy();
      expect(entry.level, hangul).toBe('A1');
    }
  });
  it('retags beginner essentials as A1, including pack words learners expect first', () => {
    for (const hangul of ['엄마', '하나', '월요일', '검은색', '까만색']) {
      const entry = entries.find((item) => item.hangul === hangul);
      expect(entry, hangul).toBeTruthy();
      expect(entry.level, hangul).toBe('A1');
    }
  });
  it('keeps the Korean life apps guide practical and linked to study items', () => {
    const appTrack = guideTracks.find((track) => track.id === 'track-life-apps');
    const unitIds = new Set((appTrack?.units || []).map((unit) => unit.id));

    expect(appTrack?.units?.length).toBe(5);
    expect(unitIds).toEqual(
      new Set([
        'guide-f-naver-map',
        'guide-f-baemin',
        'guide-f-kakao-t',
        'guide-f-verification',
        'guide-f-translation-dictionary',
      ]),
    );

    for (const unit of appTrack?.units || []) {
      expect(unit.keyPhrases?.length, unit.id).toBeGreaterThanOrEqual(5);
      expect(unit.beginnerGuide?.length, unit.id).toBeGreaterThanOrEqual(3);
      expect(unit.steps?.length, unit.id).toBeGreaterThanOrEqual(5);
      expect(unit.deepLinks?.length, unit.id).toBeGreaterThanOrEqual(1);
      expect(unit.linkedEntryIds?.every((id) => !!findEntry(id)), unit.id).toBe(true);
    }
  });

  describe('truthful B1 tagging', () => {
    it('promotes the vocabulary first taught in B1 chapters', () => {
      const b1 = entries.filter((e) => e.level === 'B1');
      expect(b1.length).toBeGreaterThan(0);
      // The advertised "A1–B1" range is now real.
      expect(levels).toContain('B1');
    });
    it('only promotes items that are core to a B1 chapter (not reused earlier)', () => {
      const b1ChapterCore = new Set();
      const earlierCore = new Set();
      for (const ch of chapters) {
        const ids = [...(ch.coreVocabularyIds || []), ...(ch.patternIds || [])];
        for (const id of ids) (/B1/i.test(ch.level || '') ? b1ChapterCore : earlierCore).add(id);
      }
      for (const e of entries) {
        if (e.level !== 'B1') continue;
        expect(b1ChapterCore.has(e.id)).toBe(true);
        expect(earlierCore.has(e.id)).toBe(false);
      }
    });
  });
});
