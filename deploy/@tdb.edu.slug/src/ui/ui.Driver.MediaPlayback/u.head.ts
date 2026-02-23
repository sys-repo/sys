import { type t } from './common.ts';

export const resolveBeatMediaEmpty: t.TimecodePlaybackDriver.ResolveBeatMedia = () => undefined;

export function shouldInitPlayback(args: {
  readonly hasTimeline: boolean;
  readonly hasPlayback: boolean;
  readonly initToken: string;
  readonly lastInitToken: string;
}) {
  if (!args.hasTimeline) return false;
  if (!args.hasPlayback) return false;
  if (args.lastInitToken === args.initToken) return false;
  return true;
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

export function toBundle(
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
