import React from 'react';
import { type t, Color, css, D, SplitPane } from './common.ts';
import { Nav } from './ui.Nav.tsx';
import { Main } from './ui.slot.Main.tsx';

export const LayoutTreeSplit: React.FC<t.LayoutTreeSplitProps> = (props) => {
  const { debug = false, split = D.split, slots = {} } = props;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <SplitPane
        debug={debug}
        theme={theme.name}
        active={false}
        orientation={'horizontal'}
        value={split}
        onChange={(e) => props.onSplitChange?.({ split: e.ratios })}
      >
        <Nav {...props} />
        <Main {...props} />
      </SplitPane>
    </div>
  );
};
