import React from 'react';
import { createSlots } from '../../ui.Driver.TreeContent/-spec.content/mod.ts';
import type { DebugSignals } from '../../ui.Driver.TreeContent/-spec/-SPEC.Debug.tsx';
import { BackButton, TreeHost } from '../../ui.TreeHost/-spec/mod.ts';
import { toPlaybackData, usePlaybackRuntime } from './-u.playback.runtime.ts';
import { type t, Color, css, KeyValue, Player, Signal, useEffectController } from './common.ts';

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

  const baseSlots = createSlots({
    content,
    selection,
    theme: theme.name,
  });
  const media = toPlaybackData(content.data);
  const runtime = usePlaybackRuntime({
    playback: media?.playback,
    assets: media?.assets,
  });
  React.useEffect(() => {
    if (!props.runtime) return;
    props.runtime.value = runtime;
    return () => {
      if (props.runtime?.value === runtime) props.runtime.value = undefined;
    };
  }, [props.runtime, runtime]);

  const aux = media && (
    <div>
      <Player.Video.Decks.UI
        decks={runtime.decks}
        active={runtime.snapshot.state.decks.active}
        muted={true}
        show={'both'}
        aspectRatio={'4/3'}
        gap={20}
        style={{ Margin: [10, 20, 15, 20] }}
      />
      <KeyValue.UI
        theme={theme.name}
        layout={{ kind: 'table' }}
        style={{ Margin: [0, 20, 10, 20] }}
        items={[
          { kind: 'title', v: 'Media Runtime' },
          {
            k: 'current:video',
            v: runtime.currentMediaSrc ?? '(none)',
            href: runtime.currentMediaSrc
              ? { v: { infer: true, display: 'trim-http' } }
              : undefined,
            mono: true,
          },
        ]}
      />
    </div>
  );
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
