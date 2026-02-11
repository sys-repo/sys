import React from 'react';
import { type t, KeyValue } from './common.ts';
import { arraySize } from './u.data.ts';

type Args = {
  readonly playback?: t.PlaybackContentData;
  readonly loading: boolean;
  readonly theme?: t.CommonTheme;
};

export function renderPlaybackMain(args: Args) {
  const playback = args.playback;
  if (!playback) return undefined;
  return (
    <div>
      <KeyValue.UI
        theme={args.theme}
        items={[
          { kind: 'title', v: 'Playback Content' },
          { k: 'docid', v: playback.docid ?? '' },
          { k: 'assets', v: arraySize(playback.assets) },
          { k: 'beats', v: arraySize((playback.playback as { beats?: unknown })?.beats) },
        ]}
      />
      {args.loading ? <div>{'Loading content'}</div> : undefined}
    </div>
  );
}

export function renderPlaybackLeaf(args: Args) {
  const playback = args.playback;
  if (!playback) return undefined;
  return (
    <KeyValue.UI
      theme={args.theme}
      items={[
        { kind: 'title', v: 'Leaf Playback' },
        { k: 'docid', v: playback.docid ?? '' },
        { k: 'assets', v: arraySize(playback.assets) },
        ...(args.loading ? [{ k: 'status', v: 'loading' }] : []),
      ]}
    />
  );
}
