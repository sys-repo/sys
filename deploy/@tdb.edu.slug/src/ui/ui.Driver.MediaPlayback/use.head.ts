import React from 'react';
import { type t, PlaybackDriver, Player } from './common.ts';
import {
  resolveBeatMediaEmpty,
  shouldInitPlayback,
  toBundle,
  toCurrentPayload,
  toCurrentPosition,
  toPlaybackData,
} from './u.head.ts';

type MediaData = ReturnType<typeof toPlaybackData>;
type HeadView = t.MediaPlaybackDriver.HeadView;
type Runtime = t.MediaPlaybackDriver.PlaybackRuntime;

export function usePlaybackRuntime(args: {
  readonly playback?: t.SpecTimelineManifest;
  readonly assets?: readonly t.SpecTimelineAsset[];
  readonly sessionKey?: string;
}): Runtime {
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
    const timelinePlayback = timeline.playback;
    if (
      !shouldInitPlayback({
        hasTimeline: !!timelinePlayback,
        hasPlayback: !!args.playback,
        initToken,
        lastInitToken: lastInitTokenRef.current,
      })
    ) {
      return;
    }
    if (!timelinePlayback) return;
    lastInitTokenRef.current = initToken;
    controller.init({
      timeline: timelinePlayback,
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
export type PlaybackRuntime = t.MediaPlaybackDriver.PlaybackRuntime;

export function useHead(args: {
  readonly content: t.TreeContentController.State;
  readonly selection: t.TreeSelectionController.State;
  readonly theme: t.CommonTheme;
  readonly muted?: boolean;
  readonly renderNavFooter?: (args: {
    readonly runtime: Runtime;
    readonly theme: t.CommonTheme;
    readonly media: NonNullable<MediaData>;
  }) => React.ReactNode;
}): HeadView {
  const media: MediaData = toPlaybackData(args.content.data);
  const sessionKey = args.content.request?.id ?? args.content.key;

  const runtime = usePlaybackRuntime({
    playback: media?.playback,
    assets: media?.assets,
    sessionKey,
  });

  React.useEffect(() => {
    const next = !!args.muted;
    if (runtime.decks.A.props.muted.value !== next) runtime.decks.A.props.muted.value = next;
    if (runtime.decks.B.props.muted.value !== next) runtime.decks.B.props.muted.value = next;
  }, [runtime.decks, args.muted]);

  const position = toCurrentPosition(runtime.snapshot);
  const payload = toCurrentPayload({
    playback: media?.playback,
    snapshot: runtime.snapshot,
  });

  const slotsPatch: t.TreeHostSlots = {
    nav: {
      footer:
        media && args.renderNavFooter
          ? args.renderNavFooter({ runtime, theme: args.theme, media })
          : undefined,
    },
  };

  return {
    runtime,
    derived: {
      media,
      sessionKey,
      position,
      payload,
      currentMediaSrc: runtime.currentMediaSrc,
    },
    slotsPatch,
  } as const;
}
