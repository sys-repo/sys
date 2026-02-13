import React from 'react';
import { type t, PlaybackDriver, Player } from './common.ts';

export function usePlaybackRuntime(args: {
  readonly playback?: t.SpecTimelineManifest;
  readonly assets?: readonly t.SpecTimelineAsset[];
  readonly origin?: t.SlugUrlOrigin;
}) {
  const timeline = PlaybackDriver.Util.usePlaybackTimeline({
    spec: args.playback
      ? { composition: args.playback.composition, beats: args.playback.beats }
      : undefined,
  });

  const decks = React.useMemo(() => Player.Video.Decks.create(), []);
  const bundle = toBundle(args.playback, args.assets, args.origin?.cdn.default);
  const { controller, snapshot } = PlaybackDriver.useDriver({
    decks,
    init: timeline.playback ? { timeline: timeline.playback } : undefined,
    resolveBeatMedia: bundle ? PlaybackDriver.Util.resolveBeatMedia(bundle) : () => undefined,
  });

  return {
    decks,
    controller,
    snapshot,
    timeline,
    bundle,
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

function toHref(href: string, base: string | undefined): string {
  if (typeof href !== 'string') return '';
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (!base) return href;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function toBundle(
  playback: t.SpecTimelineManifest | undefined,
  assets: readonly t.SpecTimelineAsset[] | undefined,
  hrefBase: string | undefined,
): t.SpecTimelineBundle | undefined {
  if (!playback) return undefined;
  const table = new Map<string, t.SpecTimelineAsset>();
  for (const item of assets ?? []) {
    table.set(`${item.kind}:${item.logicalPath}`, { ...item, href: toHref(item.href, hrefBase) });
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

