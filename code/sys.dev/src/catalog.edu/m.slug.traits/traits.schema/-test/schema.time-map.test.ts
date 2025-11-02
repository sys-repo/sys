import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { Traits } from '../mod.ts';

describe('schema.time-map', () => {
  const S = Traits.Schema.TimeMap.Props;

  it('valid: minimal and typical shapes', () => {
    const cases = [
      {}, // minimal: all fields optional
      { id: 'tm-001' }, // id matches repo Pattern.Id()
      { name: 'Release Markers' },
      { description: 'Named instants for milestones' },
      { id: 'time-map-alpha.01', name: 'Alpha', description: 'Notes' },
      { name: '', description: '' }, // empty strings allowed (no minLength enforced)
    ] as const;

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true);
  });

  it('valid: string fields accept unicode and freeform', () => {
    const cases = [
      { name: 'スペース/日本語/ファイル' },
      { description: 'Δοκιμή περιγραφής - emoji ✅' },
      { name: 'dot.prefixed', description: '.hidden-like but fine' },
    ] as const;

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true);
  });

  it('invalid: wrong types, noise, and id shape violations', () => {
    const bads: unknown[] = [
      { extra: true }, // additionalProperties: false
      { id: 123 }, // wrong type
      { name: 1 }, // wrong type
      { description: null }, // wrong type
      null,
      undefined,
      42,
      'str',
      true,
    ];

    for (const v of bads) expect(Value.Check(S, v)).to.eql(false);
  });
});
