import { describe, expect, it, Value } from '../-test.ts';
import { SlugSchema, TraitBindingSchema, TraitDefSchema } from './mod.ts';

describe(`catalog.edu/slug`, () => {
  it('minimal slug with trait bindings (no props)', () => {
    const slug = {
      id: 'slug-001',
      traits: [
        { as: 'trait-1', id: 'video' },
        { as: 'gallery', id: 'image-sequence' },
      ],
    };
    expect(Value.Check(SlugSchema, slug)).to.be.true;
  });

  describe('SlugSchema', () => {
    it('accepts minimal slug: id + traits[] (no props)', () => {
      const slug = {
        id: 'slug-001',
        traits: [],
      };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('accepts slug with trait bindings and arbitrary props object (values are Unknown)', () => {
      const slug = {
        id: 's1',
        traits: [
          { as: 'trait-1', id: 'video' },
          { as: 'gallery', id: 'image-sequence' },
        ],
        // NOTE: semantic validation not enforced yet; any shape is allowed per alias
        props: {
          'trait-1': { any: { nested: ['ok'] }, n: 123 },
          gallery: 'also-ok',
        },
      };
      expect(Value.Check(SlugSchema, slug)).to.be.true;
    });

    it('rejects when slug has additional properties', () => {
      const bad = {
        id: 's1',
        traits: [],
        extra: true, // not allowed
      };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
      const errs = Array.from(Value.Errors(SlugSchema, bad));
      expect(errs.some((e) => e.path === '/extra')).to.be.true;
    });

    it('rejects invalid id pattern', () => {
      const bads = [
        { id: '-bad', traits: [] }, // starts with hyphen
        { id: 'Bad', traits: [] }, // uppercase start
        { id: '', traits: [] }, // empty
      ];
      for (const bad of bads) {
        expect(Value.Check(SlugSchema, bad)).to.be.false;
      }
    });

    it('rejects non-array traits', () => {
      const bad = { id: 's1', traits: {} as unknown };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('rejects non-record props', () => {
      const bads = [
        { id: 's1', traits: [], props: [] }, // array
        { id: 's1', traits: [], props: 123 }, // number
        { id: 's1', traits: [], props: null }, // null
      ];
      for (const bad of bads) {
        expect(Value.Check(SlugSchema, bad)).to.be.false;
      }
    });
  });

  describe('TraitBindingSchema', () => {
    it('accepts valid binding { as, id }', () => {
      const ok = { as: 'trait-1', id: 'video' };
      expect(Value.Check(TraitBindingSchema, ok)).to.be.true;
    });

    it('rejects bad alias pattern', () => {
      const bads = [
        { as: '1bad', id: 'video' }, // must start with [a-z]
        { as: 'Bad', id: 'video' }, // uppercase start
        { as: '', id: 'video' }, // empty
      ];
      for (const bad of bads) {
        expect(Value.Check(TraitBindingSchema, bad)).to.be.false;
      }
    });

    it('rejects bad trait id pattern', () => {
      const bads = [
        { as: 'x', id: 'Video' }, // uppercase start
        { as: 'x', id: '' }, // empty
      ];
      for (const bad of bads) {
        expect(Value.Check(TraitBindingSchema, bad)).to.be.false;
      }
    });

    it('rejects additional properties', () => {
      const bad = { as: 'x', id: 'video', extra: true };
      expect(Value.Check(TraitBindingSchema, bad)).to.be.false;
    });
  });

  describe('TraitDefSchema', () => {
    it('accepts minimal trait def with id (props optional)', () => {
      const ok1 = { id: 'video' };
      const ok2 = { id: 'image-sequence', props: {} };
      expect(Value.Check(TraitDefSchema, ok1)).to.be.true;
      expect(Value.Check(TraitDefSchema, ok2)).to.be.true;
    });

    it('rejects additional properties on trait def', () => {
      const bad = { id: 'video', x: 1 };
      expect(Value.Check(TraitDefSchema, bad)).to.be.false;
    });

    it('rejects bad trait def id pattern', () => {
      const bads = [
        { id: 'Video' }, // Capitalized
        { id: '' }, //      Empty
      ];
      for (const bad of bads) {
        expect(Value.Check(TraitDefSchema, bad)).to.be.false;
      }
    });
  });

  describe('trait integration shape within SlugSchema', () => {
    it('traits must contain only TraitBinding-shaped items', () => {
      const bad = {
        id: 's1',
        traits: [{ id: 'video' }], // missing `as`
      };
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    });

    it('props keys are strings; values are Unknown (structural pass only)', () => {
      const ok = {
        id: 's1',
        traits: [{ as: 't1', id: 'video' }],
        props: { t1: Symbol('anything-goes') as unknown }, // Unknown passes.
      };
      expect(Value.Check(SlugSchema, ok)).to.be.true;
    });
  });
});
