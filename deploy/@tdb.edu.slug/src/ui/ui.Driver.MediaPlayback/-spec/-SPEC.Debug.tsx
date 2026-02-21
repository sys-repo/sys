import React from 'react';
import { HeadObject, PayloadObject } from './-ui.Objects.tsx';
import { PlayControls } from './-ui.PlayControls.tsx';
import { TimelineInfo } from './-ui.TimelineInfo.tsx';
import { toPlaybackData } from './-u.playback.runtime.ts';
import { D, type t, Color, css, Signal } from './common.ts';
import type { DebugSignals as DebugSignalsBase } from '../../ui.Driver.TreeContent/-spec/-SPEC.Debug.tsx';

export type HeadDebugProps = {
  debug: DebugSignalsBase;
  runtime?: t.SignalOptional<t.DevPlaybackRuntime | undefined>;
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
  const v = Signal.toObject(debug.props);
  const content = debug.orchestrator.content.current();
  const data = toPlaybackData(content.data);
  const playback = data?.playback;
  const assets = data?.assets;
  const runtime = props.runtime?.value;

  Signal.useRedrawEffect(() => {
    debug.listen();
    if (props.runtime) void props.runtime.value;
  });

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
        <HeadObject
          style={{ marginTop: 16 }}
          theme={theme.name}
          data={toHeadObjectData({
            selection: debug.orchestrator.selection.current(),
            content: debug.orchestrator.content.current(),
            playback,
            assets,
          })}
        />
        <PayloadObject
          style={{ marginTop: 6 }}
          theme={theme.name}
          data={{ playback, snapshot: runtime?.snapshot }}
        />
      </div>

      <TimelineInfo
        debug={v.debug}
        theme={v.theme}
        playback={playback}
        assets={assets}
        snapshot={runtime?.snapshot}
        style={{ marginTop: 12 }}
      />
      <PlayControls
        theme={v.theme}
        controller={runtime?.controller}
        snapshot={runtime?.snapshot}
        decks={runtime?.decks}
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
