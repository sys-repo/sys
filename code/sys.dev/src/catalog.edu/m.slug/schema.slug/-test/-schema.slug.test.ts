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

      // Dev ergonomics (kept minimal):
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

    it('validates ref pattern when present (crdt: and urn:crdt:; mixed-case base62; with/without path)', () => {
      const id = 'AbC012xyzDEFghijkLMNoPQRsTuV'; // 28 chars, A–Z a–z 0–9
      const goods = [
        { ref: 'crdt:create' },
        { ref: `crdt:${id}` },
        { ref: `crdt:${id}/a` },
        { ref: `crdt:${id}/a.B_c-1.v2` },
        { ref: `urn:crdt:${id}` },
        { ref: `urn:crdt:${id}/deep/path-01.v3` },
      ];
      for (const ok of goods) expect(Value.Check(SlugSchema, ok)).to.be.true;
    });

    it('enforces path segment rules (no empty segments, no dot segments, no leading non-alnum)', () => {
      const id = '2JgVjx9KAMcB3D6EZEyBB18jBX6P';
      const bads = [
        { ref: `crdt:${id}/` }, //      trailing slash → empty last segment
        { ref: `crdt:${id}//a` }, //    empty middle segment
        { ref: `crdt:${id}/.` }, //     dot segment
        { ref: `crdt:${id}/..` }, //    dot-dot segment
        { ref: `crdt:${id}/-seg` }, //  leading hyphen disallowed
        { ref: `crdt:${id}/_seg` }, //  leading underscore disallowed
        { ref: `crdt:${id}/.seg` }, //  leading dot disallowed
      ];
      for (const bad of bads) expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects "crdt:create" when a path is appended', () => {
      const bads = [{ ref: 'crdt:create/' }, { ref: 'crdt:create/a' }, { ref: 'crdt:create/a/b' }];
      for (const bad of bads) expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects UUID refs (crdt: and urn:crdt:)', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const bads = [{ ref: `crdt:${uuid}` }, { ref: `urn:crdt:${uuid}` }];
      for (const bad of bads) expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects invalid id pattern even when ref is present', () => {
      const bads = [
        { id: '-bad', ref: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' },
        { id: 'Bad', ref: 'urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/seg' },
        { id: '', ref: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' },
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
