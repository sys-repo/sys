import { type t, c, describe, expect, expectTypeOf, it, Value } from '../../../-test.ts';
import { SlugSchema, TraitBindingSchema, TraitDefSchema } from '../mod.ts';

describe('SlugSchema', () => {
  it('accepts minimal slug: id + traits[] (no props)', () => {
    const slug = { id: 'slug-001', traits: [] };
    expect(Value.Check(SlugSchema, slug)).to.be.true;
  });

  it('accepts slug with trait bindings and arbitrary props {object} (values are <Unknown>)', () => {
    const slug = {
      id: 's1',
      traits: [
        { as: 'trait-1', id: 'video' },
        { as: 'gallery', id: 'image-sequence' },
      ],
      // NOTE: semantic validation not enforced yet; any shape is allowed per alias.
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
      extra: true, // ← not allowed
    };
    expect(Value.Check(SlugSchema, bad)).to.be.false;

    const errs = Array.from(Value.Errors(SlugSchema, bad));
    expect(errs.some((e) => e.path === '/extra')).to.be.true;

    // Print:
    console.info();
    console.info(`${c.green('Value.Check(SlugSchema)')}.${c.brightCyan('errors:')}`);
    console.info(errs);
    console.info();
  });

  it('rejects invalid <id> pattern', () => {
    const bads = [
      { id: '-bad', traits: [] }, // ← starts with hyphen
      { id: 'Bad', traits: [] }, //  ← uppercase start
      { id: '', traits: [] }, //     ← empty
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
      { id: 's1', traits: [], props: [] }, //   ← array
      { id: 's1', traits: [], props: 123 }, //  ← number
      { id: 's1', traits: [], props: null }, // ← null
    ];
    for (const bad of bads) {
      expect(Value.Check(SlugSchema, bad)).to.be.false;
    }
  });
});
