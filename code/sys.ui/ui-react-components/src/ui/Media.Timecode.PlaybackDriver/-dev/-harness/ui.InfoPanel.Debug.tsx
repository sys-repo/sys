import type { InfoPanelProps } from './ui.InfoPanel.tsx';

import React from 'react';
import { Button, Color, css, Json, ObjectView } from './common.ts';

/**
 * Component:
 */
export const Debug: React.FC<InfoPanelProps> = (props) => {
  const { snapshot, beat, bundle } = props;

  const snapshotData = snapshot && {
    hasTimeline: !!snapshot.state.timeline,
    ready: snapshot.state.ready,
    cmds: snapshot.cmds,
  };

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

  const obj = (n: string, d: unknown, marginTop = 8, expand = 1) => {
    data.set(n, d);
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
      {obj('props.bundle', bundle)}
      {beat && obj('props.beat', beat)}
      {snapshot && obj('playback.snapshot', snapshotData)}
      <Button
        label={'copy debug'}
        theme={theme.name}
        style={{ marginTop: 10 }}
        onClick={handleCopy}
      />
    </div>
  );
};
