import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { Traits } from '../mod.ts';

describe('schema.time-map', () => {
  const S = Traits.Schema.TimeMap.Props;

  it('valid: minimal root shape', () => {
    expect(Value.Check(S, {})).to.eql(true);
    expect(
      Value.Check(S, { id: 'alpha.01', name: 'Release Markers', description: 'Notes' }),
    ).to.eql(true);
  });

  it('invalid: root noise, wrong types', () => {
    const bads: unknown[] = [
      { extra: true }, // additionalProperties: false
      { id: 123 },
      { name: 1 },
      { description: null },
      null,
      undefined,
      42,
      'str',
      true,
    ];
    for (const v of bads) expect(Value.Check(S, v)).to.eql(false);
  });

  it('valid: timestamps as a map keyed by WebVTT; values may be path-ref string or {ref?,name?}', () => {
    const cases = [
      // Optional field and empty object:
      { timestamps: {} },
      // Mixed value entries:
      {
        timestamps: {
          '00:00:00.000': 'media/intro', // path-ref string
          '03:25.000': { ref: 'clips/scene-1', name: 'Scene 1' }, // object with ref+name
          '12:34:56.789': { name: 'Peak' }, // object with name only
          '00:59:59.999': { ref: 'segments/finale' }, // object with ref only
        },
      },
      // Hours optional form accepted:
      {
        timestamps: { '59:59.999': { name: 'End of minute-hourless' } },
      },
    ] as const;

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true);
  });

  it('invalid: bad WebVTT keys (must be HH:MM:SS.mmm or MM:SS.mmm with dot milliseconds)', () => {
    const badKeys = [
      '0:0:0.000', // single digits not allowed
      '60:00.000', // minutes tens place must be 0-5
      '00:60:00.000', // seconds minutes out of range
      '00:00:60.000',
      '00:00:00,000', // comma is SRT, not WebVTT
      '00:00:00.00', // not 3-digit millis
      '00:00:00.0000', // too many millis
      '3:25.000', // single-digit minutes
      '123:00:00.000', // hours must be exactly two digits if present
    ];

    for (const k of badKeys) {
      const v = { timestamps: { [k]: { name: 'x' } } };
      expect(Value.Check(S, v)).to.eql(false);
    }
  });

  it('invalid: bad value entries (wrong types / extra props)', () => {
    const bads: unknown[] = [
      { timestamps: { '00:00:01.000': 123 } }, // number
      { timestamps: { '00:00:01.000': true } }, // boolean
      { timestamps: { '00:00:01.000': [] } }, // array
      { timestamps: { '00:00:01.000': { ref: 123 } } }, // ref wrong type
      { timestamps: { '00:00:01.000': { name: 42 } } }, // name wrong type
      { timestamps: { '00:00:01.000': { ref: 'clips/a', name: 'A', extra: 'nope' } } }, // additional props
    ];

    for (const v of bads) expect(Value.Check(S, v)).to.eql(false);
  });

  it('valid: realistic mixed object', () => {
    const value = {
      id: 'tm.alpha',
      name: 'Chapter Marks',
      description: 'Primary markers layered over transcript.',
      timestamps: {
        '00:00:00.000': 'media/intro',
        '00:00:03.250': { name: 'Hook' },
        '00:01:00.000': { ref: 'chapters/1' },
        '05:30.500': { ref: 'chapters/2', name: 'Discussion' },
        '12:00:00.000': { name: 'Noon mark' },
      },
    };
    expect(Value.Check(S, value)).to.eql(true);
  });
});
