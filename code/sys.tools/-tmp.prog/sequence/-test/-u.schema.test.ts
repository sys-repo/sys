import { type t, describe, expect, it } from '../../-test.ts';

import { Schema } from '@sys/schema';
import { toSchema } from '@sys/schema/recipe';
import { SequenceRecipe } from '../u.schema.ts';

describe('schema: sequence', () => {
  it('valid sequence passes core schema check', () => {
    const TB = Schema.Value;
    const S = toSchema(SequenceRecipe);

    const value: t.Sequence = [
      {
        video: '/video.mp4',
        script: 'intro script',
        slice: '00:00..00:10',
        timestamps: {
          '00:00:00.000': { text: { body: 'hello world' } },
        },
      },
    ];

    expect(TB.Check(S, value)).to.eql(true);
  });

  it('invalid sequence fails when required fields are missing', () => {
    const TB = Schema.Value;
    const S = toSchema(SequenceRecipe);

    // Missing required `video` field.
    const value = [{ script: 'missing video' }];
    expect(TB.Check(S, value)).to.eql(false);
  });
});
