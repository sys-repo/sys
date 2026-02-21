import React from 'react';
import { createSlots } from '../../ui.Driver.Tree.shared/-spec.slots.shared/mod.ts';
import type { DebugSignals } from '../../ui.Driver.TreeContent/-spec/-SPEC.Debug.tsx';
import { BackButton, TreeHost } from '../../ui.TreeHost/-spec/mod.ts';
import {
  toCurrentPayload,
  toCurrentPosition,
  toPlaybackData,
  usePlaybackRuntime,
} from './-u.playback.runtime.ts';
import { MediaPlaybackAux } from './-ui.Aux.tsx';
import { type t, Color, css, Signal, useEffectController } from './common.ts';

export type SpecRootProps = {
  debug: DebugSignals;
  runtime?: t.SignalOptional<t.DevPlaybackRuntime | undefined>;
  style?: t.CssValue;
};

/**
 * Component:
 */
export const SpecRoot: React.FC<SpecRootProps> = (props) => {
  const { debug } = props;
  const orchestrator = debug.orchestrator;
  const v = Signal.toObject(debug.props);

  const selection = useEffectController(orchestrator.selection) ?? orchestrator.selection.current();
  const content = useEffectController(orchestrator.content) ?? orchestrator.content.current();
  const view = orchestrator.selection.view();

  const loading = content.phase === 'loading';
  const spinner: t.TreeHostProps['spinner'] = loading
    ? [{ slot: 'tree', position: 'top' }, { slot: 'main' }]
    : undefined;

  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    back: css({ Absolute: [-35, null, null, -35] }),
  };

  const media = toPlaybackData(content.data);
  const runtime = usePlaybackRuntime({
    playback: media?.playback,
    assets: media?.assets,
  });
  const playbackPosition = toCurrentPosition(runtime.snapshot);
  const playbackPayload = toCurrentPayload({
    playback: media?.playback,
    snapshot: runtime.snapshot,
  });

  React.useEffect(() => {
    if (!props.runtime) return;
    props.runtime.value = runtime;
    return () => {
      if (props.runtime?.value === runtime) props.runtime.value = undefined;
    };
  }, [props.runtime, runtime]);

  const aux = media && <MediaPlaybackAux theme={theme.name} runtime={runtime} />;
  const baseSlots = createSlots({
    content,
    selection,
    playbackPosition,
    playbackPayload,
    theme: theme.name,
  });
  const slots: t.TreeHostSlots = { ...baseSlots, aux };

  return (
    <div className={styles.base.class}>
      <BackButton
        style={styles.back}
        theme={theme.name}
        selectedPath={view.treeHost.selectedPath}
        onBack={(e) => orchestrator.selection.intent({ type: 'path.request', path: e.next })}
      />
      <TreeHost.UI
        debug={v.debug}
        theme={theme.name}
        tree={view.treeHost.tree}
        selectedPath={view.treeHost.selectedPath}
        spinner={spinner}
        slots={slots}
        onPathRequest={(e) => orchestrator.selection.intent({ type: 'path.request', path: e.path })}
        onNodeSelect={(e) => {
          if (!e.is.leaf) return;
          orchestrator.selection.intent({ type: 'path.request', path: e.path });
        }}
      />
    </div>
  );
};
