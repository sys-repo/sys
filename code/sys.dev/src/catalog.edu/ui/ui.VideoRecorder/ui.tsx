import React from 'react';

import { type t, Color, css, D } from './common.ts';
import { Config } from './ui.Config.tsx';
import { Header } from './ui.Header.tsx';
import { Main } from './ui.Main.tsx';

type P = t.VideoRecorderViewProps;

export const VideoRecorderView: React.FC<P> = (props) => {
  const { debug = false, configVisible = D.configVisible } = props;

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
        gridTemplateColumns: configVisible ? '1fr auto' : '1fr',
        minHeight: 0,
      }),
      main: css({}),
      config: css({
        display: configVisible ? 'grid' : 'none',
        pointerEvents: configVisible ? 'auto' : 'none',
      }),
    },
  };

  const elBody = (
    <div className={styles.body.base.class}>
      <Main {...props} style={styles.body.main} />
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
