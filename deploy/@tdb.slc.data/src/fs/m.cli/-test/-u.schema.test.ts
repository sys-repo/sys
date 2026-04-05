import { describe, expect, it } from '../../../-test.ts';
import { StageProfileSchema } from '../schema/mod.ts';

describe('StageProfileSchema', () => {
  it('initializes a valid stage profile', () => {
    const doc = StageProfileSchema.initial('my-data');
    const checked = StageProfileSchema.validate(doc);

    expect(doc).to.eql({ mount: 'my-data', source: '.' });
    expect(checked.ok).to.eql(true);
  });

  it('rejects an invalid mount', () => {
    const checked = StageProfileSchema.validate({ mount: 'bad/mount', source: '.' });

    expect(checked.ok).to.eql(false);
    expect(checked.errors.length > 0).to.eql(true);
  });
});
