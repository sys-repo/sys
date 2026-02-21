import React from 'react';
import { type t, PlaybackDriver, Player } from './common.ts';

export type DevPlaybackRuntime = ReturnType<typeof usePlaybackRuntime>;
const resolveBeatMediaEmpty: t.TimecodePlaybackDriver.ResolveBeatMedia = () => undefined;

export function usePlaybackRuntime(args: {
  readonly playback?: t.SpecTimelineManifest;
  readonly assets?: readonly t.SpecTimelineAsset[];
  readonly sessionKey?: string;
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

  const initToken = args.sessionKey ?? `${args.playback?.docid ?? ''}:${args.playback?.beats.length ?? 0}`;
  const lastInitTokenRef = React.useRef<string>('');
  React.useEffect(() => {
    if (!timeline.playback) return;
    if (!args.playback) return;
    if (lastInitTokenRef.current === initToken) return;
    lastInitTokenRef.current = initToken;
    controller.init({
      timeline: timeline.playback,
      startBeat: 0 as t.TimecodeState.Playback.BeatIndex,
    });
  }, [controller, timeline.playback, args.playback, initToken]);

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

export function toCurrentPosition(
  snapshot?: t.TimecodeState.Playback.Snapshot,
): string | undefined {
  const state = snapshot?.state;
  const index = state?.currentBeat;
  const timeline = state?.timeline;
  if (index == null || !timeline) return undefined;

  const segIndex = timeline.segments
    .map((s) => s.beat)
    .findIndex((beat) => beat.from <= index && index < beat.to);
  if (segIndex < 0) return undefined;

  return `segment-${segIndex + 1}:beat-${index + 1}`;
}

export function toCurrentPayload(args: {
  playback?: t.SpecTimelineManifest;
  snapshot?: t.TimecodeState.Playback.Snapshot;
}): unknown {
  const index = args.snapshot?.state?.currentBeat;
  if (index == null) return undefined;
  return args.playback?.beats[index]?.payload;
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
