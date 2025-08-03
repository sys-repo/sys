import React from 'react';
import { type t, Color, css, D } from './common.ts';

import { NotReady } from './ui.NotReady.tsx';

export const DevEditor: React.FC<t.DevEditorProps> = (props) => {
  const { debug = false, repo } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
    body: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };

  const elNoRepo = !repo && (
    <NotReady theme={theme.name} label={'Not ready: crdt-repository not specified.'} />
  );
  const elError = elNoRepo;
  const elBody = !elError && (
    <div className={styles.body.class}>
    </div>
  );

  return <div className={css(styles.base, props.style).class}>{elError || elBody}</div>;
};
