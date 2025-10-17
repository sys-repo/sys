import React from 'react';

import { type t, Color, css, D } from './common.ts';
import { Config } from './ui.Config.tsx';
import { Header } from './ui.Header.tsx';

type P = t.VideoRecorderViewProps;

export const VideoRecorderView: React.FC<P> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    body: {
      base: css({
        display: 'grid',
        gridTemplateColumns: '1fr auto',
      }),
      main: css({ padding: 30 }),
      config: css({}),
    },
  };

  const elBody = (
    <div className={styles.body.base.class}>
      <div className={styles.body.main.class}>{`🐷 ${D.displayName}`}</div>
      <Config {...props} style={styles.body.config} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Header {...props} />
      {elBody}
    </div>
  );
};
