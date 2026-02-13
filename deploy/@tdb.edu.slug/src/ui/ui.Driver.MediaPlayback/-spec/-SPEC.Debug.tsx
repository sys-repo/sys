import React from 'react';
import { Payload } from './-ui.Payload.tsx';
import { PlayControls } from './-ui.PlayControls.tsx';
import {
  D,
  type t,
  Button,
  Color,
  css,
  ObjectView,
  PlaybackDriver,
  Player,
  Signal,
} from './common.ts';
import type { DebugSignals as DebugSignalsBase } from '../../ui.Driver.TreeContent/-spec/-SPEC.Debug.tsx';

export type HeadDebugProps = {
  debug: DebugSignalsBase;
  style?: t.CssInput;
};

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const HeadDebug: React.FC<HeadDebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  const content = debug.orchestrator.content.current();
  const data = toPlaybackData(content.data);
  const playback = data?.playback;
  const assets = data?.assets;

  const timeline = PlaybackDriver.Util.usePlaybackTimeline({
    spec: playback ? { composition: playback.composition, beats: playback.beats } : undefined,
  });

  const decks = React.useMemo(() => Player.Video.Decks.create(), []);
  const bundle = toBundle(playback, assets, v.origin?.cdn.default);
  const { controller, snapshot } = PlaybackDriver.useDriver({
    decks,
    init: timeline.playback ? { timeline: timeline.playback } : undefined,
    resolveBeatMedia: bundle ? PlaybackDriver.Util.resolveBeatMedia(bundle) : () => undefined,
  });

  Signal.useRedrawEffect(debug.listen);

  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <hr />

      <Button
        block
        label={() => `kind: ${v.cardKind}`}
        onClick={() => (p.cardKind.value = 'playback-content')}
      />
      <Button
        block
        label={() => `content: (reset)`}
        onClick={() => debug.orchestrator.content.intent({ type: 'reset' })}
      />
      <PlayControls theme={v.theme} controller={controller} snapshot={snapshot} decks={decks} />
      <Player.Video.Decks.UI
        decks={decks}
        active={snapshot.state.decks.active}
        muted={true}
        show={'both'}
        aspectRatio={'4/3'}
        gap={20}
        style={{ Margin: [10, 50, 15, 50] }}
      />
      <ObjectView
        name={'head:media-playback'}
        data={{
          selectedRef: debug.orchestrator.selection.current().selectedRef,
          phase: debug.orchestrator.content.current().phase,
          key: debug.orchestrator.content.current().key,
          docid: playback?.docid,
          beats: playback?.beats.length,
          assets: assets?.length,
        }}
        expand={0}
        style={{ marginTop: 16 }}
      />
      <Payload
        debug={v.debug}
        theme={v.theme}
        playback={playback}
        assets={assets}
        snapshot={snapshot}
        style={{ marginTop: 12 }}
      />
    </div>
  );
};

function toPlaybackData(input: unknown):
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
