import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Nav } from './ui.Nav.tsx';
import { Main } from './ui.slot.Main.tsx';
import { SlotHost } from './ui.SlotHost.tsx';

export const TreeHost: React.FC<t.TreeHostProps> = (props) => {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      minWidth: 0,
      minHeight: 0,
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: '320px 1px 1fr',
    }),
    nav: css({}),
    border: css({ backgroundColor: Color.alpha(theme.fg, 0.1) }),
    maing: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <Nav {...props} style={styles.nav} />
      <div className={styles.border.class} />
      <SlotHost host={props} slot={'main'}>
        <Main {...props} />
      </SlotHost>
    </div>
  );
};
