import type { InfoPanelProps } from './ui.InfoPanel.tsx';

import React from 'react';
import { type t, Button, Color, css, Json, ObjectView } from './common.ts';

/**
 * Component:
 */
type P = InfoPanelProps & { beat?: t.Timecode.Experience.Beat };

export const Debug: React.FC<P> = (props) => {
  const { snapshot, beat } = props;

  /**
   * Handlers:
   */
  const data = new Map<string, unknown>();
  function handleCopy() {
    const json = Json.stringify(Object.fromEntries(data));
    navigator.clipboard.writeText(json);
  }

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({}) };

  const obj = (n: string, d: unknown, marginTop = 8, expand = 1, debug = true) => {
    if (debug) data.set(n, d);
    return (
      <ObjectView
        name={n}
        data={d}
        fontSize={10}
        theme={theme.name}
        style={{ marginTop }}
        expand={expand}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {beat && obj('props.beat', beat)}
      {snapshot && obj('playback.snapshot', wrangle.snapshotData(props))}
      <Button theme={theme.name} style={{ marginTop: 10 }} label={'copy'} onClick={handleCopy} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  snapshotData(props: P) {
    const { snapshot } = props;
    if (!snapshot) return;

    const { state, cmds } = snapshot;
    return {
      hasTimeline: !!state.timeline,
      currentBeat: state.currentBeat,
      vTime: state.vTime,
      phase: state.phase,
      activeDeck: state.decks.active,
      intent: state.intent,
      ready: state.ready,
      cmds,
    };
  },
} as const;
