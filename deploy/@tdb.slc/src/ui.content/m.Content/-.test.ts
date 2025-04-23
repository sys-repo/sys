import { type t, describe, expect, it } from '../../-test.ts';
import { Factory, factory } from '../m.Factory/mod.ts';
import { Player } from './common.ts';
import { Is } from './m.Content.Is.ts';
import { Video } from './m.Content.Video.ts';
import { Content } from './mod.ts';

describe('Content', () => {
  it('API', () => {
    expect(Content.Is).to.equal(Is);
    expect(Content.Video).to.equal(Video);
    expect(Content.Factory).to.equal(Factory);
    expect(Content.factory).to.equal(factory);
  });

  describe('Content.Is', () => {
    const Is = Content.Is;
    const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];

    it('Is.video', async () => {
      const test = (input: any, expected: boolean) => expect(Is.video(input)).to.eql(expected);
      test(await factory('Trailer'), true);
      test(await factory('Overview'), true);
      test(await factory('Programme'), true);
      NON.forEach((value) => test(value, false));
    });

    it('Is.static', async () => {
      const test = (input: any, expected: boolean) => expect(Is.static(input)).to.eql(expected);
      test(await factory('Entry'), true);
      NON.forEach((value) => test(value, false));
    });
  });

  describe('Content.Video', () => {
    type M = t.VideoContentMedia;
    const id = 'foo';
    const kind = 'VideoContent';
    const video = Player.Video.signals();
    const media: M = { video, timestamps: {} };

    describe('Video.media', () => {
      it('undefined', () => {
        const res = Content.Video.media({ kind, id });
        expect(res.current).to.be.undefined;
        expect(res.items).to.eql([]);
      });

      it('single item', () => {
        const res = Content.Video.media({ kind, id, media });
        expect(res.current).to.equal(media);
        expect(res.items).to.eql([media]);
      });

      it('first (of several) - no index on model', () => {
        const a: M = { video, timestamps: {} };
        const b: M = { video, timestamps: {} };
        const res = Content.Video.media({ kind, id, media: [a, b] });
        expect(res.current).to.equal(a);
        expect(res.items).to.eql([a, b]);
      });

      it('index set model', () => {
        const a: M = { video, timestamps: {} };
        const b: M = { video, timestamps: {} };
        const c: M = { video, timestamps: {} };
        const media = [a, b, c];

        const res1 = Content.Video.media({ kind, id, media, mediaIndex: 0 });
        const res2 = Content.Video.media({ kind, id, media, mediaIndex: 2 });
        const res3 = Content.Video.media({ kind, id, media, mediaIndex: 99 });
        const res4 = Content.Video.media({ kind, id, media, mediaIndex: -1 });
        expect(res1.current).to.equal(a);
        expect(res2.current).to.equal(c);
        expect(res3.current).to.equal(undefined);
        expect(res4.current).to.equal(undefined);
      });
    });
  });
});
