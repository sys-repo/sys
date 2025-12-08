import { type t, describe, expect, it, Schema, toSchema } from '../../-test.ts';
import { SequenceRecipe } from '../u.schema.ts';
import { Sequence } from '../mod.ts';

describe('schema: sequence (raw SequenceRecipe)', () => {
  const T = Schema.Value;
  const S = toSchema(SequenceRecipe);
  const slice = '00:00..00:10' as t.Timecode.SliceString; // branded test literal

  it('valid sequence passes core schema check', () => {
    const value: t.Sequence = [
      {
        video: '/video.mp4',
        script: 'intro script',
        slice,
        timestamps: { '00:00:00.000': { text: { body: 'hello world' } } },
      },
    ];
    expect(T.Check(S, value)).to.eql(true);
  });

  it('invalid sequence fails when required fields are missing', () => {
    // Missing required `video` field.
    const value = [{ script: 'missing video' }];
    expect(T.Check(S, value)).to.eql(false);
  });

  it('normalised timestamp text (null → missing) passes schema', () => {
    const value: t.Sequence = [
      {
        video: '/video.mp4',
        script: 'intro script',
        slice,
        timestamps: { '00:00:00.000': { text: { body: 'hello world', headline: undefined } } },
      },
    ];
    expect(T.Check(S, value)).to.eql(true);
  });
});

describe('Sequence.validate', () => {
  const slice = '00:00..00:10' as t.Timecode.SliceString;

  it('returns ok:true for a valid sequence', () => {
    const value: t.Sequence = [
      {
        video: '/video.mp4',
        script: 'intro script',
        slice,
        timestamps: { '00:00:00.000': { text: { body: 'hello world' } } },
      },
    ];

    const res = Sequence.validate(value);
    expect(res.ok).to.eql(true);
    if (res.ok) {
      // result.sequence is t.Sequence
      expect(res.sequence).to.eql(value);
    }
  });

  it('returns ok:false for non-array input', () => {
    const res = Sequence.validate({ not: 'an array' });
    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.error).to.be.instanceOf(Error);
      expect(res.error.message).to.contain('expected an array of items');
    }
  });

  it('returns ok:false when a sequence item is structurally wrong', () => {
    const value = [{ script: 'missing discriminating key' }];
    const res = Sequence.validate(value);
    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.error.message).to.contain('Invalid sequence item at index 0');
    }
  });

  it('returns ok:false when schema check fails', () => {
    // Has a discriminator, so itemLike passes, but violates schema (e.g. bad timestamps shape).
    const value = [{ video: '/video.mp4', timestamps: { foo: 'bar' } }];
    const res = Sequence.validate(value);
    expect(res.ok).to.eql(false);
    if (!res.ok) {
      expect(res.error.message).to.contain('does not conform to Sequence schema');
    }
  });
});
