import { type t, describe, expect, it, Schema } from '../../-test.ts';
import { Sequence, SequenceSchema } from '../mod.ts';

describe('Schema', () => {
  const T = Schema.Value;
  const S = SequenceSchema;

  describe('SequenceRecipe (raw)', () => {
    const slice = '00:00..00:10' as t.Timecode.SliceString; // branded test literal

    it('valid sequence passes core schema check', () => {
      const value: t.SlugSequence = [
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
      const value: t.SlugSequence = [
        {
          video: '/video.mp4',
          script: 'intro script',
          slice,
          timestamps: {
            '00:00:00.000': { text: { body: 'hello world', headline: undefined } },
          },
        },
      ];
      expect(T.Check(S, value)).to.eql(true);
    });

    it('slug item passes SequenceItem', () => {
      const value: t.SlugSequence = [
        { slug: '/:core-slugs/5.2.1-intro-strategy-model', display: 'inline' },
      ];

      expect(T.Check(S, value)).to.eql(true);
    });

    it('pause item passes SequenceItem', () => {
      const value: t.SlugSequence = [{ pause: '3s' }];
      expect(T.Check(S, value)).to.eql(true);
    });
  });

  describe('SequenceSchema (compiled)', () => {
    const T = Schema.Value;

    it('accepts a slug item', () => {
      const value: t.SlugSequence = [
        { slug: '/:core-slugs/5.2.1-intro-strategy-model', display: 'inline' },
      ];
      expect(T.Check(SequenceSchema, value)).to.eql(true);
    });

    it('accepts a pause item', () => {
      const value: t.SlugSequence = [{ pause: '3s' }];
      expect(T.Check(SequenceSchema, value)).to.eql(true);
    });
  });

  describe('Sequence.validate', () => {
    const slice = '00:00..00:10' as t.Timecode.SliceString;

    it('returns ok:true for a valid sequence (headline + body, no image)', () => {
      const value: t.SlugSequence = [
        {
          video: '/video.mp4',
          script: 'intro script',
          slice,
          timestamps: {
            '00:00:00.000': {
              text: {
                headline: 'Intro',
                body: 'hello world',
              },
            },
          },
        },
      ];

      const res = Sequence.validate(value);
      expect(res.ok).to.eql(true);
      if (res.ok) {
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

    it('returns ok:false when body text is present without a headline', () => {
      const value: t.SlugSequence = [
        {
          video: '/video.mp4',
          script: 'intro script',
          slice,
          timestamps: {
            '00:00:00.000': {
              text: {
                body: '- Cuts Through Noise',
              },
            },
          },
        },
      ];

      const res = Sequence.validate(value);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(res.error.message).to.contain('body text requires a headline');
      }
    });

    it('returns ok:false when image and body text appear together in a timestamp entry', () => {
      const value: t.SlugSequence = [
        {
          video: '/video.mp4',
          script: 'intro script',
          slice,
          timestamps: {
            '00:00:00.000': {
              image: '/:images/three-models-diagram.png',
              text: {
                headline: 'Integrated System',
                body: '- Customer Model',
              },
            },
          },
        },
      ];

      const res = Sequence.validate(value);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(res.error.message).to.contain('image and body text cannot appear simultaneously');
      }
    });

    it('returns ok:false when body text is present inside an image item timestamp', () => {
      const value: t.SlugSequence = [
        {
          image: '/:images/three-models-diagram.png',
          timestamps: {
            '00:00:00.000': {
              text: {
                headline: 'Integrated System',
                body: '- Customer Model',
              },
            },
          },
        },
      ];

      const res = Sequence.validate(value);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(res.error.message).to.contain('image and body text cannot appear simultaneously');
      }
    });

    it('accepts image + headline/tagline (no body) in an image item timestamp', () => {
      const value: t.SlugSequence = [
        {
          image: '/:images/three-models-diagram.png',
          timestamps: {
            '00:00:00.000': {
              text: {
                headline: 'Integrated System',
                tagline: 'Three models working together',
              },
            },
          },
        },
      ];

      const res = Sequence.validate(value);
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.sequence).to.eql(value);
      }
    });
  });
});
