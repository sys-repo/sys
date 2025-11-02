import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { Traits } from '../mod.ts';

describe('schema.concept-layout', () => {
  const S = Traits.Schema.ConceptLayout.Props;

  it('valid: crdt ref forms', () => {
    for (const v of [
      { slug: 'crdt:create' },
      { slug: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' },
      { slug: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/path' },
      { slug: 'urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' },
    ])
      expect(Value.Check(S, v)).to.eql(true);
  });

  it('invalid: non-crdt strings, missing prop, noise', () => {
    for (const v of [
      {},
      { slug: '' },
      { slug: 'not-a-crdt' },
      { slug: 'http://example.com' },
      { slug: 'crdt:' },
      { slug: 'urn:crdt:' },
      { slug: 'crdt:bad id' },
      { slug: 'crdt:create', extra: true } as unknown,
    ])
      expect(Value.Check(S, v as unknown)).to.eql(false);
  });
});
