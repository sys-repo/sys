import { type t, describe, expect, it } from '../../../-test.ts';
import { Pattern } from '../mod.ts';

describe('Pattern', () => {
  describe('Pattern.crdtRefPattern', () => {
    const { pattern } = Pattern.crdtRefPattern();
    const rx = new RegExp(pattern);

    it('accepts literal create', () => {
      const ok = ['crdt:create'];
      for (const s of ok) expect(rx.test(s)).to.eql(true);
    });

    it('accepts base62-28 id with/without path (crdt: and urn:crdt:)', () => {
      const id = '2JgVjx9KAMcB3D6EZEyBB18jBX6P'; // 28 chars (A–Z,a–z,0–9)
      const ok = [
        `crdt:${id}`,
        `crdt:${id}/a`,
        `crdt:${id}/a/b_c-1.v2`,
        `urn:crdt:${id}`,
        `urn:crdt:${id}/deep/path-01.v3`,
      ];
      for (const s of ok) expect(rx.test(s)).to.eql(true);
    });

    it('accepts UUID with/without path (crdt: and urn:crdt:)', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const ok = [
        `crdt:${uuid}`,
        `crdt:${uuid}/a`,
        `urn:crdt:${uuid}`,
        `urn:crdt:${uuid}/x/y-z.v1`,
      ];
      for (const s of ok) expect(rx.test(s)).to.eql(true);
    });

    it('rejects malformed refs', () => {
      const bad = [
        '', // empty
        'create', // missing prefix
        'crdt:create/extra', // create cannot take a path
        'crdt:', // missing id
        'crdt:short', // too short for base62-28
        'crdt:@@@/x', // invalid chars
        'urn:crdt:', // missing id
        'urn:crdt:123e4567e89b12d3a456426614174000', // uuid without dashes
        'urn:crdt:123e4567-e89b-12d3-a456-426614174000/..', // path segment invalid per our pattern
        'urn:crt:123e4567-e89b-12d3-a456-426614174000', // misspelled prefix
      ];
      for (const s of bad) expect(rx.test(s)).to.eql(false);
    });
  });

  describe('Pattern.idPattern', () => {
    const { pattern } = Pattern.idPattern();
    const rx = new RegExp(pattern);

    it('accepts stable ids', () => {
      const ok = [
        'video',
        'video-player',
        'video.player-01',
        'v',
        'v1',
        'a-.-.-b', // mixed separators allowed
        '0lead', //   may start with number
      ];
      for (const s of ok) expect(rx.test(s)).to.eql(true);
    });

    it('rejects invalid ids', () => {
      const bad = [
        '', //              empty
        '-leading', //      leading hyphen
        '.leading', //      leading dot
        '_underscore', //   underscore not allowed
        'UPPER', //         uppercase disallowed
        'miXed', //         mixed case
        'has space', //     spaces disallowed
        'slash/in', //      slash disallowed
      ];
      for (const s of bad) expect(rx.test(s)).to.eql(false);
    });
  });
});
