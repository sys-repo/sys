import { type t, describe, it, expect, Testing, Value } from '../-test.ts';
import { SlugSchema } from './mod.ts';

describe(`catalog.edu/slug`, () => {
  it('minimal slug with trait bindings (no props)', () => {
    const slug = {
      id: 'slug-001',
      traits: [
        { as: 'trait-1', id: 'video' },
        { as: 'gallery', id: 'image-sequence' },
      ],
    };
    expect(Value.Check(SlugSchema, slug)).to.equal(true);
  });
});
