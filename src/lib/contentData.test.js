import { describe, expect, it } from 'vitest';
import {
  entries,
  findEntry,
  findReader,
  guideTracks,
  hanjaRoots,
  hanjaRootsForEntry,
  readers,
  vocabPacks,
} from './data.js';

describe('content data surfaces', () => {
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
      'pack-reactions-agree',
      'pack-reactions-surprise',
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

  it('exposes the C7 hanja root families with split homophones', () => {
    expect(hanjaRoots).toHaveLength(40);
    expect(hanjaRoots.every((root) => root.members.length >= 3)).toBe(true);
    expect(hanjaRoots[0].review).toBeUndefined();
    expect(hanjaRoots[0].members[0].reviewed).toBeUndefined();

    const school = findEntry('word-noun-006');
    const schoolRoots = hanjaRootsForEntry(school.id).map((root) => root.id);
    expect(schoolRoots).toContain('root-hak');

    const splitReadings = new Set(
      hanjaRoots
        .map((root) => root.reading)
        .filter((reading, _index, readings) => readings.filter((item) => item === reading).length >= 2),
    );
    expect(splitReadings).toEqual(new Set(['공', '문', '사']));
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

  it('adds the C9 day-one guide units and survival expressions', () => {
    const appManual = guideTracks.find((track) => track.id === 'track-app-manual');
    expect(appManual).toBeTruthy();
    expect((appManual.units || []).map((unit) => unit.id)).toEqual([
      'guide-app-how-to-use',
      'guide-app-study-flow',
      'guide-app-korean-typing',
      'guide-app-how-korean-works',
    ]);
    const studyFlow = appManual.units.find((unit) => unit.id === 'guide-app-study-flow');
    expect(studyFlow?.beginnerGuide?.length).toBeGreaterThanOrEqual(5);
    expect(studyFlow?.steps?.length).toBeGreaterThanOrEqual(6);
    expect(studyFlow?.checkpoints?.some((item) => item.includes('native help'))).toBe(true);

    for (const hangul of ['안녕하세요', '천천히 말해 주세요', '화장실이 어디예요?']) {
      const entry = entries.find((item) => item.hangul === hangul);
      expect(entry, hangul).toBeTruthy();
      expect(entry.level, hangul).toBe('A1');
    }
  });
});
