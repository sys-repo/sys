import React from 'react';
import { HeadObject, PayloadObject } from './-ui.Objects.tsx';
import { PlayControls } from './-ui.PlayControls.tsx';
import { TimelineInfo } from './-ui.TimelineInfo.tsx';
import { toPlaybackData, usePlaybackRuntime } from './-u.playback.runtime.ts';
import { D, type t, Button, Color, css, Player, Signal } from './common.ts';
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
  const runtime = usePlaybackRuntime({
    playback,
    assets,
    origin: v.origin,
  });

  Signal.useRedrawEffect(debug.listen);

  const theme = Color.theme(v.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: '1fr auto',
      gridAutoRows: 'auto',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>
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
        <HeadObject
          theme={theme.name}
          data={toHeadObjectData({
            selection: debug.orchestrator.selection.current(),
            content: debug.orchestrator.content.current(),
            playback,
            assets,
          })}
          style={{ marginTop: 16 }}
        />
        <PayloadObject
          theme={theme.name}
          data={{ playback, snapshot: runtime.snapshot }}
          style={{ marginTop: 10, marginBottom: 20 }}
        />
      </div>

      <Player.Video.Decks.UI
        decks={runtime.decks}
        active={runtime.snapshot.state.decks.active}
        muted={true}
        show={'both'}
        aspectRatio={'4/3'}
        gap={20}
        style={{
          // Margin: [10, 50, 15, 50],
          backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
        }}
      />

      <TimelineInfo
        debug={v.debug}
        theme={v.theme}
        playback={playback}
        assets={assets}
        snapshot={runtime.snapshot}
        style={{ marginTop: 12 }}
      />
      <PlayControls
        theme={v.theme}
        controller={runtime.controller}
        snapshot={runtime.snapshot}
        decks={runtime.decks}
        style={{ marginTop: 15 }}
      />
    </div>
  );
};

function toHeadObjectData(args: {
  readonly selection: t.TreeSelectionController.State;
  readonly content: t.TreeContentController.State;
  readonly playback?: t.SpecTimelineManifest;
  readonly assets?: readonly t.SpecTimelineAsset[];
}) {
  return {
    selectedRef: args.selection.selectedRef,
    phase: args.content.phase,
    key: args.content.key,
    docid: args.playback?.docid,
    beats: args.playback?.beats.length,
    assets: args.assets?.length,
  } as const;
}
