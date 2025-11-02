import { describe, expect, it } from '../../../-test.ts';
import { Pattern } from '../mod.ts';

describe('PatternRecipe.CrdtRef (create | self | base62)', () => {
  const pattern = Pattern.CrdtRef().pattern;
  const regex = new RegExp(pattern);
  expect(pattern, 'CRDT pattern must be defined').to.be.a('string');

  it('accepts literal create', () => {
    const ok = ['crdt:create'];
    for (const s of ok) expect(regex.test(s)).to.eql(true);
  });

  it('accepts "self" as id-equivalent, with/without path (crdt: and urn:crdt:)', () => {
    const ok = [
      'crdt:self',
      'crdt:self/a',
      'crdt:self/a/b_c-1.v2',
      'urn:crdt:self',
      'urn:crdt:self/deep/path-01.v3',
    ];
    for (const s of ok) expect(regex.test(s)).to.eql(true);
  });

  it('accepts base62-28 id with/without path (crdt: and urn:crdt:)', () => {
    const id = '2JgVjx9KAMcB3D6EZEyBB18jBX6P'; // 28 chars
    const ok = [
      `crdt:${id}`,
      `crdt:${id}/a`,
      `crdt:${id}/a/b_c-1.v2`,
      `urn:crdt:${id}`,
      `urn:crdt:${id}/deep/path-01.v3`,
    ];
    for (const s of ok) expect(regex.test(s)).to.eql(true);
  });

  it('rejects malformed or non-base62 refs', () => {
    const bad = [
      '', // empty
      'create', // missing prefix
      'crdt:create/extra', // create cannot take a path
      'crdt:', // missing id
      'crdt:short', // too short for base62-28
      'crdt:@@@/x', // invalid chars
      'urn:crdt:', // missing id
      'urn:crdt:123e4567-e89b-12d3-a456-426614174000', // UUID (invalid, base62 only)
      'urn:crdt:123e4567-e89b-12d3-a456-426614174000/section.1', // UUID path invalid
      'urn:crdt:123e4567e89b12d3a456426614174000', // UUID w/o dashes invalid
      'urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/..', // path segment invalid
      'urn:crt:2JgVjx9KAMcB3D6EZEyBB18jBX6P', // misspelled prefix
      'crdt:selfish', // only exact "self" allowed
      'urn:crdt:selfish', // only exact "self" allowed
    ];
    for (const s of bad) expect(regex.test(s)).to.eql(false);
  });
});
