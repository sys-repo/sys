import { describe, expect, it } from '../../../-test.ts';
import { SequenceSchema } from '../m.Schema.ts';

describe('SequenceSchema.validate', () => {
  it('accepts a minimal valid sequence', () => {
    const input = [{ video: 'video.mp4' }];
    const res = SequenceSchema.validate(input);
    expect(res.ok).to.equal(true);
    if (res.ok) expect(res.sequence).to.eql(input);
  });

  it('accepts a slug item', () => {
    const input = [{ slug: '/:core-slugs/5.2.1-intro-strategy-model', display: 'inline' }];
    const res = SequenceSchema.validate(input);
    expect(res.ok).to.equal(true);
    if (res.ok) expect(res.sequence).to.eql(input);
  });

  it('accepts a pause item', () => {
    const input = [{ pause: '3s' }];
    const res = SequenceSchema.validate(input);
    expect(res.ok).to.equal(true);
    if (res.ok) expect(res.sequence).to.eql(input);
  });

  it('accepts title + body when headline is blank (navigation title pattern)', () => {
    const input = [
      {
        video: 'video.mp4',
        timestamps: {
          '00:00:00.000': {
            title: 'What You Have Built',
            text: {
              headline: '',
              body: 'What You Have Built',
            },
          },
        },
      },
    ];

    const res = SequenceSchema.validate(input);
    expect(res.ok).to.equal(true);
    if (res.ok) expect(res.sequence).to.eql(input);
  });

  it('rejects non-array input', () => {
    const res = SequenceSchema.validate({ video: 'video.mp4' });
    expect(res.ok).to.equal(false);
  });

  it('rejects an array with an unknown item shape (hits itemLike pass)', () => {
    const res = SequenceSchema.validate([{}]);
    expect(res.ok).to.equal(false);
    if (!res.ok) {
      expect(res.error.message).to.contain('Invalid sequence item at index 0');
    }
  });

  it('rejects when schema check fails even though itemLike passes (bad timestamps shape)', () => {
    // Has a discriminator (video), so itemLike passes, but violates schema (timestamps must be an object of entries).
    const input = [{ video: 'video.mp4', timestamps: { foo: 'bar' } }];
    const res = SequenceSchema.validate(input);
    expect(res.ok).to.equal(false);
    if (!res.ok) {
      expect(res.error.message).to.contain('does not conform to Sequence schema');
    }
  });

  it('rejects invariant: body requires a heading', () => {
    const input = [{ pause: '2s', text: { body: 'Body with no headline and no title.' } }];

    const res = SequenceSchema.validate(input);
    expect(res.ok).to.equal(false);
    if (!res.ok) {
      expect(res.error.message).to.contain('body text requires a heading');
    }
  });

  it('rejects invariant: image and body text cannot co-exist', () => {
    const input = [
      {
        video: 'video.mp4',
        timestamps: {
          '00:00:01': {
            title: 'ok heading',
            image: 'img.png',
            text: { body: 'Not allowed with image active.' },
          },
        },
      },
    ];

    const res = SequenceSchema.validate(input);
    expect(res.ok).to.equal(false);
    if (!res.ok) {
      expect(res.error.message).to.contain('image and body text cannot appear simultaneously');
    }
  });
});
