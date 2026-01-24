import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Nav } from './ui.Nav.tsx';
import { Main } from './ui.slot.Main.tsx';

export const TreeHost: React.FC<t.TreeHostProps> = (props) => {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      minWidth: 0,
      minHeight: 0,
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
    }),
    nav: css({
      borderRight: `solid 0.5px ${Color.alpha(theme.fg, 0.1)}`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <Nav {...props} style={styles.nav} />
      <Main {...props} />
    </div>
  );
};
