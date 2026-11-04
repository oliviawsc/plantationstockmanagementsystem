import { describe, expect, it } from 'vitest';
import { en } from '../en';
import { extraEn, extraMs } from '../extra';
import { ms } from '../ms';
import { translate } from '../index';
import { decodeEntities } from '../RichText';

describe('dictionaries', () => {
  it('ms has exactly the en keys', () => {
    expect(Object.keys(ms).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(extraMs).sort()).toEqual(Object.keys(extraEn).sort());
  });
  it('new keys do not shadow legacy keys', () => {
    expect(Object.keys(extraEn).filter((k) => k in en)).toEqual([]);
  });
  it('fills {vars}', () => {
    expect(translate('en', 'sync_pending_fail', { n: 3 })).toMatch(/^3 pending/);
  });
  it('decodes entities', () => {
    expect(decodeEntities('&#128065; a &amp; b')).toBe('👁 a & b');
  });
});
