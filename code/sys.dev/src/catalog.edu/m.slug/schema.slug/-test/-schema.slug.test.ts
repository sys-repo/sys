import { c, describe, expect, it, Value } from '../../../-test.ts';
import { SlugSchema } from '../mod.ts';

describe('SlugSchema', () => {
  /**
   * Variant: minimal
   * Shape: { id?, description?, traits? } and NO data/ref.
   */
  describe('variant: minimal', () => {
    it('accepts empty object (no id/description/traits/data/ref)', () => {
      const slug = {};
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('accepts traits[] only (no id/description/data/ref)', () => {
      const slug = { traits: [] };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('accepts optional id and description (no traits/data/ref)', () => {
      const slug = { id: 'slug-001', description: 'human-readable summary' };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('rejects invalid id pattern when present', () => {
      const bads = [{ id: '-bad' }, { id: 'Bad' }, { id: '' }];
      for (const bad of bads) expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects non-array traits', () => {
      const bad = { traits: {} as unknown };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects additional properties', () => {
      const bad = { traits: [], extra: true };
      expect(Value.Check(SlugSchema, bad)).to.be.false;

      // Dev ergonomics log:
      const errs = Array.from(Value.Errors(SlugSchema, bad));
      console.info();
      console.info(`${c.green('Value.Check(SlugSchema)')}.${c.brightCyan('errors:')}`);
      console.info(errs);
      console.info();
    });
  });

  /**
   * Variant: with-data
   * Shape: { id?, description?, traits, data }
   * Rules: data requires traits; data must be a record of Unknown values.
   */
  describe('variant: with data', () => {
    it('accepts traits+data where data contains arbitrary values (Unknown)', () => {
      const slug = {
        id: 's1',
        traits: [
          { as: 'video', of: 'video-player' },
          { as: 'rec', of: 'video-recorder' },
        ],
        data: {
          video: { any: { nested: ['ok'] }, n: 123 },
          rec: 'also-ok',
        },
      };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('accepts empty data object when traits are present', () => {
      const ok = { traits: [], data: {} };
      expect(Value.Check(SlugSchema, ok)).to.be.true;
    });

    it('rejects non-record data', () => {
      const bads = [
        { traits: [], data: [] },
        { traits: [], data: 123 },
        { traits: [], data: null },
      ];
      for (const bad of bads) expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects presence of data when traits are missing', () => {
      const bads = [
        { data: {} },
        { id: 'x', data: {} },
        { description: 'y', data: {} },
        { id: 'x', description: 'y', data: {} },
      ];
      for (const bad of bads) expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects additional properties', () => {
      const bad = { traits: [], data: {}, extra: true };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });
  });

  /**
   * Variant: ref
   * Shape: { id?, description?, ref? }
   * Rules: may not coexist with traits/data.
   * Note: ref is optional to support incremental authoring.
   */
  describe('variant: ref', () => {
    it('accepts ref only', () => {
      const slug = { ref: 'crdt:create' };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('accepts id/description with ref', () => {
      const slug = {
        id: 'prog-1',
        description: 'pointer to canonical entity',
        ref: 'urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P',
      };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('accepts omission of ref (still valid minimal)', () => {
      const slug = { id: 'maybe-later' };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('validates ref pattern when present', () => {
      const goods = [
        { ref: 'crdt:create' },
        { ref: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' },
        { ref: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/path/to/node' },
        { ref: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/section.1' },
      ];
      for (const ok of goods) expect(Value.Check(SlugSchema, ok)).to.be.true;

      const bads = [
        { ref: '' },
        { ref: 'crdt:' },
        { ref: 'urn:crdt:' },
        { ref: '../escape' },
        { ref: 'crdt:..' },
        { ref: 'urn:crdt:123e4567-e89b-12d3-a456-426614174000' }, // NB: uuid, not base62
      ];
      for (const bad of bads) expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects additional properties', () => {
      const bad = { ref: 'crdt:create', extra: true };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });
  });

  /**
   * Disjointness: forbid mixing ref with traits/data.
   */
  describe('disjointness: no mixing', () => {
    it('rejects ref + traits', () => {
      const bad = { ref: 'crdt:create', traits: [] };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects ref + data', () => {
      const bad = { ref: 'crdt:create', data: {} };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects ref + traits + data', () => {
      const bad = { ref: 'crdt:create', traits: [], data: {} };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });
  });
});
