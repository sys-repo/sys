import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Toolbar } from './ui.Toolbar.tsx';

export const Icons: React.FC<t.IconsProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      gap: 5,
    }),
    body: css({
      position: 'relative',
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Toolbar theme={theme.name} />
      <div className={styles.body.class}>{`🐷 ${D.displayName}`}</div>
    </div>
  );
};
