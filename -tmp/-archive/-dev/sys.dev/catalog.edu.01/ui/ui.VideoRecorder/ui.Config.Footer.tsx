import React from 'react';

import { type t, Color, css } from './common.ts';
import { RecorderControls } from './ui.Recorder.Controls.tsx';
import { RecorderInfo } from './ui.Recorder.Info.tsx';
import { TitleBar } from './ui.TitleBar.tsx';

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
      <TitleBar left={'Media'} theme={theme.name} style={{}} />
      <RecorderInfo theme={theme.name} style={{ Margin: [13, 20, 15, 20] }} signals={signals} />
      <RecorderControls
        theme={theme.name}
        signals={signals}
        onStatusChange={(e) => {
          if (signals?.recorder) signals.recorder.value = e;
        }}
      />
    </div>
  );
};
