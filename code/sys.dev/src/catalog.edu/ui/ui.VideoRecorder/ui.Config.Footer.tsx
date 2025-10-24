import React from 'react';

import { type t, Color, css } from './common.ts';
import { edgeBorder } from './u.ts';
import { RecorderControls } from './ui.Recorder.Controls.tsx';
import { Info } from './ui.Recorder.Info.tsx';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Footer: React.FC<P> = (props) => {
  const { debug = false, signals } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Info theme={theme.name} style={{ Margin: [0, 30, 25, 30] }} signals={signals} />
      <RecorderControls
        theme={theme.name}
        stream={signals?.stream.value}
        style={{ borderTop: edgeBorder(theme) }}
        onStatusChange={(e) => {
          if (signals?.recorder) signals.recorder.value = e;
        }}
      />
    </div>
  );
};
