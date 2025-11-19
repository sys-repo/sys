import { describe, expect, it } from '../../-test.ts';
import { AliasIs } from '../m.Is.ts';
import { AliasResolver } from '../mod.ts';

describe('AliasResolver.Is', () => {
  it('API', () => {
    // Ensure the public surface is wired correctly.
    expect(AliasResolver.Is).to.eql(AliasIs);
  });

  describe('Is.aliasKey', () => {
    const fn = AliasIs.aliasKey;

    it('returns false for non-string inputs', () => {
      expect(fn()).to.eql(false);
      expect(fn(null)).to.eql(false);
      expect(fn(undefined)).to.eql(false);
      expect(fn(123)).to.eql(false);
      expect(fn({})).to.eql(false);
      expect(fn([])).to.eql(false);
      expect(fn(() => {})).to.eql(false);
      expect(fn(Symbol('x'))).to.eql(false);
    });

    it('requires leading ":"', () => {
      expect(fn('index')).to.eql(false);
      expect(fn('core-videos')).to.eql(false);
      expect(fn(':')).to.eql(false); // empty body
    });

    it('accepts valid alias keys', () => {
      const valid = [
        ':a',
        ':abc',
        ':index',
        ':core',
        ':core-videos',
        ':assets-2025',
        ':p2p',
        ':p2p-data3',
        ':abc123',
      ];

      for (const key of valid) {
        expect(fn(key), `expected valid: ${key}`).to.eql(true);
      }
    });

    it('rejects uppercase characters', () => {
      expect(fn(':A')).to.eql(false);
      expect(fn(':Core')).to.eql(false);
      expect(fn(':core-Videos')).to.eql(false);
    });

    it('rejects invalid characters', () => {
      const bad = [
        ':core.images', // dots not allowed
        ':core_images', // underscores not allowed
        ':core videos', // spaces not allowed
        ':core!videos', // punctuation not allowed
        ':core@2025', // punctuation not allowed
        ':core/videos', // slash not allowed
        ':äbc', // unicode / accents
      ];

      for (const key of bad) {
        expect(fn(key), `expected invalid: ${key}`).to.eql(false);
      }
    });

    it('disallows trailing hyphens', () => {
      expect(fn(':core-')).to.eql(false);
      expect(fn(':p2p-')).to.eql(false);
    });

    it('disallows empty segment after hyphen', () => {
      expect(fn(':core--videos')).to.eql(false);
      expect(fn(':core--')).to.eql(false);
      expect(fn(':--core')).to.eql(false);
    });

    it('disallows colon beyond the first character', () => {
      expect(fn(':co:re')).to.eql(false);
      expect(fn(':p2p:data')).to.eql(false);
    });
  });
});
