import React from 'react';
import { type t, PlaybackDriver, Player } from './common.ts';

export type DevPlaybackRuntime = ReturnType<typeof usePlaybackRuntime>;
const resolveBeatMediaEmpty: t.TimecodePlaybackDriver.ResolveBeatMedia = () => undefined;

export function usePlaybackRuntime(args: {
  readonly playback?: t.SpecTimelineManifest;
  readonly assets?: readonly t.SpecTimelineAsset[];
}) {
  const timeline = PlaybackDriver.Util.usePlaybackTimeline({
    spec: args.playback
      ? { composition: args.playback.composition, beats: args.playback.beats }
      : undefined,
  });

  const decks = React.useMemo(() => Player.Video.Decks.create(), []);
  const bundle = React.useMemo(() => toBundle(args.playback, args.assets), [args.playback, args.assets]);
  const resolveBeatMedia = React.useMemo<t.TimecodePlaybackDriver.ResolveBeatMedia>(() => {
    if (!bundle) return resolveBeatMediaEmpty;
    return PlaybackDriver.Util.resolveBeatMedia(bundle);
  }, [bundle]);
  const { controller, snapshot } = PlaybackDriver.useDriver({
    decks,
    init: timeline.playback ? { timeline: timeline.playback } : undefined,
    resolveBeatMedia,
  });

  const initKey = `${args.playback?.docid ?? ''}:${args.playback?.beats.length ?? 0}`;
  const lastInitKeyRef = React.useRef<string>('');
  React.useEffect(() => {
    if (!timeline.playback) return;
    if (!args.playback) return;
    if (lastInitKeyRef.current === initKey) return;
    lastInitKeyRef.current = initKey;
    controller.init({
      timeline: timeline.playback,
      startBeat: 0 as t.TimecodeState.Playback.BeatIndex,
    });
  }, [controller, timeline.playback, args.playback, initKey]);

  const currentBeatIndex = snapshot.state.currentBeat ?? (0 as t.TimecodeState.Playback.BeatIndex);
  const currentBeatMedia = React.useMemo(() => {
    if (!bundle) return undefined;
    return PlaybackDriver.Util.resolveBeatMedia(bundle)(currentBeatIndex);
  }, [bundle, currentBeatIndex]);

  return {
    decks,
    controller,
    snapshot,
    timeline,
    bundle,
    currentBeatIndex,
    currentBeatMedia,
    currentMediaSrc: currentBeatMedia?.src,
  } as const;
}

export function toPlaybackData(input: unknown):
  | {
      readonly playback: t.SpecTimelineManifest;
      readonly assets: readonly t.SpecTimelineAsset[];
    }
  | undefined {
  if (!input || typeof input !== 'object') return undefined;
  if ((input as { kind?: string }).kind !== 'playback-content') return undefined;
  const item = input as {
    readonly playback?: t.SpecTimelineManifest;
    readonly assets?: readonly t.SpecTimelineAsset[];
  };
  if (!item.playback || !Array.isArray(item.assets)) return undefined;
  return {
    playback: item.playback,
    assets: item.assets,
  };
}

function toBundle(
  playback: t.SpecTimelineManifest | undefined,
  assets: readonly t.SpecTimelineAsset[] | undefined,
): t.SpecTimelineBundle | undefined {
  if (!playback) return undefined;
  const table = new Map<string, t.SpecTimelineAsset>();
  for (const item of assets ?? []) {
    table.set(`${item.kind}:${item.logicalPath}`, item);
  }
  return {
    docid: playback.docid,
    spec: {
      composition: playback.composition,
      beats: playback.beats,
    },
    resolveAsset(args) {
      return table.get(`${args.kind}:${args.logicalPath}`);
    },
  };
}
