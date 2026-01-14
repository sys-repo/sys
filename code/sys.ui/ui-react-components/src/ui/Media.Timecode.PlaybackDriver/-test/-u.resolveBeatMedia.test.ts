import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { PlaybackDriver } from '../mod.ts';

describe('PlaybackDriver.Util.resolveBeatMedia', () => {
  function makeBundle(args: {
    beats: readonly unknown[];
    resolveMedia?: (args: { kind: string; logicalPath: string }) => string | undefined;
  }): t.TimecodePlaybackDriver.Wire.Bundle {
    const resolveMedia: t.MediaResolver = args.resolveMedia ?? (() => undefined);
    return {
      spec: { beats: args.beats } as t.Timecode.Playback.Spec<unknown>,
      resolveMedia,
    } as t.TimecodePlaybackDriver.Wire.Bundle;
  }

  it('returns <undefined> when beat index is out of range', () => {
    const bundle = makeBundle({ beats: [] });
    const resolve = PlaybackDriver.Util.resolveBeatMedia(bundle);
    expect(resolve(0 as t.Index)).to.eql(undefined);
  });

  it('returns <undefined> when beat has no src', () => {
    const bundle = makeBundle({ beats: [{ pause: 0, payload: {}, src: undefined }] });
    const resolve = PlaybackDriver.Util.resolveBeatMedia(bundle);
    expect(resolve(0 as t.Index)).to.eql(undefined);
  });

  it('returns <undefined> when src.kind or src.logicalPath is missing', () => {
    const bundleA = makeBundle({
      beats: [{ payload: {}, src: { kind: undefined, logicalPath: 'x', time: 0 } }],
    });
    expect(PlaybackDriver.Util.resolveBeatMedia(bundleA)(0)).to.eql(undefined);

    const bundleB = makeBundle({
      beats: [{ payload: {}, src: { kind: 'video', logicalPath: undefined, time: 0 } }],
    });
    expect(PlaybackDriver.Util.resolveBeatMedia(bundleB)(0)).to.eql(undefined);
  });

  it('returns <undefined> when resolver returns <undefined>', () => {
    const bundle = makeBundle({
      beats: [{ payload: {}, src: { kind: 'video', logicalPath: 'p', time: 0 } }],
      resolveMedia: () => undefined,
    });
    const resolve = PlaybackDriver.Util.resolveBeatMedia(bundle);
    expect(resolve(0 as t.Index)).to.eql(undefined);
  });

  it('calls resolveMedia({kind, logicalPath}) and returns { src:url, slice }', () => {
    const calls: Array<{ kind: string; logicalPath: string }> = [];
    const bundle = makeBundle({
      beats: [
        {
          payload: {},
          src: { kind: 'video', logicalPath: 'video:1', time: 123, slice: '00:00..00:10' },
        },
      ],
      resolveMedia(args) {
        calls.push(args);
        return 'https://cdn.example/video.mp4';
      },
    });

    const resolve = PlaybackDriver.Util.resolveBeatMedia(bundle);
    const res = resolve(0 as t.Index);

    expect(calls.length).to.eql(1);
    expect(calls[0]).to.eql({ kind: 'video', logicalPath: 'video:1' });
    expect(res).to.eql({
      src: 'https://cdn.example/video.mp4',
      slice: '00:00..00:10',
    });
  });
});
