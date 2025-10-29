import { c, describe, expect, it, Value } from '../../../-test.ts';
import { SlugSchema } from '../mod.ts';

describe('SlugSchema', () => {
  /**
   * Minimal variant: { id?, description?, traits? } and NO data.
   */
  describe('variant: minimal', () => {
    it('accepts minimal slug: empty object (no id/description/traits/data)', () => {
      const slug = {};
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('accepts minimal slug: traits[] only (no id/description/data)', () => {
      const slug = { traits: [] };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('accepts slug with optional id and description (no data)', () => {
      const slug = {
        id: 'slug-001',
        description: 'human-readable summary',
      };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('rejects when slug has additional properties', () => {
      const bad = {
        traits: [],
        extra: true, // ← not allowed
      };

      // Must reject:
      expect(Value.Check(SlugSchema, bad)).to.be.false;

      // Must report at least one error (error shape may vary across union branches):
      const errs = Array.from(Value.Errors(SlugSchema, bad));
      expect(errs.length > 0).to.be.true;

      // Dev ergonomics log:
      console.info();
      console.info(`${c.green('Value.Check(SlugSchema)')}.${c.brightCyan('errors:')}`);
      console.info(errs);
      console.info();
    });

    it('rejects invalid id pattern when present', () => {
      const bads = [
        { id: '-bad' }, // ← starts with hyphen
        { id: 'Bad' }, // ← uppercase start
        { id: '' }, // ← empty
      ];
      for (const bad of bads) {
        expect(Value.Check(SlugSchema, bad)).to.be.false;
      }
    });

    it('rejects non-array traits', () => {
      const bad = { traits: {} as unknown };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });
  });

  /**
   * With-data variant: { id?, description?, traits, data } — traits REQUIRED if data present.
   */
  describe('variant: with data', () => {
    it('accepts slug with trait bindings and arbitrary data values (Unknown)', () => {
      const slug = {
        id: 's1',
        traits: [
          { as: 'video', of: 'video-player' },
          { as: 'rec', of: 'video-recorder' },
        ],
        // NOTE: semantic validation not enforced by schema; any shape allowed under each alias.
        data: {
          video: { any: { nested: ['ok'] }, n: 123 },
          rec: 'also-ok',
        },
      };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('rejects non-record data', () => {
      const bads = [
        { traits: [], data: [] }, // ← array
        { traits: [], data: 123 }, // ← number
        { traits: [], data: null }, // ← null
      ];
      for (const bad of bads) {
        expect(Value.Check(SlugSchema, bad)).to.be.false;
      }
    });

    it('rejects presence of data when traits are missing', () => {
      const bads = [
        { data: {} },
        { id: 'x', data: {} },
        { description: 'y', data: {} },
        { id: 'x', description: 'y', data: {} },
      ];
      for (const bad of bads) {
        expect(Value.Check(SlugSchema, bad)).to.be.false;
      }
    });

    it('accepts empty data object when traits are present', () => {
      const ok = { traits: [], data: {} };
      expect(Value.Check(SlugSchema, ok)).to.be.true;
    });
  });
});
