import { describe, expect, it } from '../../-test.ts';
import { Schema } from '../common.ts';
import { PlaybackSchema } from '../mod.ts';
import { schema } from '../u.manfest.schema.ts';

describe(`TimecodePlayback.Manifest`, () => {
  describe('Manifest.schema', () => {
    it('api', () => {
      expect(PlaybackSchema.Manifest.schema).to.eql(schema);
    });

    it('schema: accepts minimal valid manifest (payload unconstrained)', () => {
      const s = PlaybackSchema.Manifest.schema();
      const input = {
        docid: 'abc' as const,
        composition: [{ src: '/video-1.webm', slice: '00:00..00:31' }],
        beats: [
          {
            src: { kind: 'video', logicalPath: '/video-1.webm', time: 0 },
            pause: 3000,
            payload: { anything: { goes: ['here'] } },
          },
        ],
      };

      expect(Schema.Value.Check(s, input)).to.eql(true);

      // Strict: no extras at root.
      expect(Schema.Value.Check(s, { ...input, extra: 123 })).to.eql(false);

      // Strict: kind must be 'video' | 'image'.
      expect(
        Schema.Value.Check(s, {
          ...input,
          beats: [{ ...input.beats[0], src: { ...input.beats[0].src, kind: 'audio' } }],
        }),
      ).to.eql(false);
    });

    it('schema: enforces payload when payload schema is supplied', () => {
      const Type = Schema.Type;
      const payloadSchema = Type.Object({ title: Type.String() }, { additionalProperties: false });
      const s = schema({ payload: payloadSchema });

      const ok = {
        docid: 'abc',
        composition: [{ src: '/video-1.webm' }],
        beats: [
          {
            src: { kind: 'video', logicalPath: '/video-1.webm', time: 0 },
            payload: { title: 'x' },
          },
        ],
      };

      const badMissing = { ...ok, beats: [{ ...ok.beats[0], payload: {} }] };
      const badExtra = { ...ok, beats: [{ ...ok.beats[0], payload: { title: 'x', extra: 1 } }] };

      expect(Schema.Value.Check(s, ok)).to.eql(true);
      expect(Schema.Value.Check(s, badMissing)).to.eql(false);
      expect(Schema.Value.Check(s, badExtra)).to.eql(false);
    });
  });

  describe('Manifest.standard', () => {
    it('returns a Standard Schema v1 adapter that validates (ok → value)', () => {
      const std = PlaybackSchema.Manifest.standard();
      const validate = std['~standard'].validate;

      const input = {
        docid: 'abc',
        composition: [{ src: '/video-1.webm', slice: '00:00..00:31' }],
        beats: [
          {
            src: { kind: 'video', logicalPath: '/video-1.webm', time: 0 },
            pause: 3000,
            payload: { anything: { goes: ['here'] } },
          },
        ],
      };

      const res = validate(input);
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.value).to.eql(input);
      }
    });

    it('returns a Standard Schema v1 adapter that reports issues (bad → issues)', () => {
      const std = PlaybackSchema.Manifest.standard();
      const validate = std['~standard'].validate;

      const input = {
        docid: 'abc',
        composition: [{ src: '/video-1.webm' }],
        beats: [
          {
            src: { kind: 'audio', logicalPath: '/video-1.webm', time: 0 }, // invalid kind
            payload: {},
          },
        ],
      };

      const res = validate(input);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(Array.isArray(res.issues)).to.eql(true);
        expect(res.issues.length > 0).to.eql(true);

        // Path should point at the failing field.
        // (Exact wording can vary; keep it loose.)
        const paths = res.issues.map((i) => i.path.join('/'));
        expect(paths.some((p) => p.includes('beats/0/src/kind'))).to.eql(true);
      }
    });
  });

  describe('Manifest.parse', () => {
    it('ok: true + value when input matches schema (payload unconstrained)', () => {
      const input = {
        docid: 'abc',
        composition: [{ src: '/video-1.webm', slice: '00:00..00:31' }],
        beats: [
          {
            src: { kind: 'video', logicalPath: '/video-1.webm', time: 0 },
            pause: 3000,
            payload: { anything: { goes: ['here'] } },
          },
        ],
      };

      const res = PlaybackSchema.Manifest.parse(input);
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.value).to.eql(input);
      }
    });

    it('ok: false + errors when input is invalid', () => {
      const input = {
        docid: 'abc',
        composition: [{ src: '/video-1.webm' }],
        beats: [
          {
            src: { kind: 'audio', logicalPath: '/video-1.webm', time: 0 }, // invalid kind
            payload: {},
          },
        ],
      };

      const res = PlaybackSchema.Manifest.parse(input);
      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(Array.isArray(res.errors)).to.eql(true);
        expect(res.errors.length > 0).to.eql(true);

        // Loose check that an error points at the failing path.
        const paths = res.errors.map((e) => e.path);
        expect(paths.some((p) => p.includes('/beats/0/src/kind'))).to.eql(true);
      }
    });

    it('respects supplied payload schema', () => {
      const Type = Schema.Type;
      const payloadSchema = Type.Object({ title: Type.String() }, { additionalProperties: false });

      const ok = {
        docid: 'abc',
        composition: [{ src: '/video-1.webm' }],
        beats: [
          {
            src: { kind: 'video', logicalPath: '/video-1.webm', time: 0 },
            payload: { title: 'x' },
          },
        ],
      };

      const bad = {
        ...ok,
        beats: [{ ...ok.beats[0], payload: { title: 'x', extra: 1 } }],
      };

      const r1 = PlaybackSchema.Manifest.parse(ok, { payload: payloadSchema });
      expect(r1.ok).to.eql(true);

      const r2 = PlaybackSchema.Manifest.parse(bad, { payload: payloadSchema });
      expect(r2.ok).to.eql(false);
    });
  });
});
