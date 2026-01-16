import React from 'react';
import { type t, Color, css, D, SplitPane, Tree } from './common.ts';

export const LayoutTreeSplit: React.FC<t.LayoutTreeSplitProps> = (props) => {
  const { debug = false, children, split = D.split, root = [] } = props;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
      color: theme.fg,
      backgroundColor: debug ? Color.ruby(0.04) : undefined,
    }),
    content: css({ display: 'grid', minWidth: 0, minHeight: 0 }),
    empty: css({
      minHeight: 120,
      display: 'grid',
      placeItems: 'center',
      color: theme.fg,
      opacity: 0.65,
      fontSize: 13,
    }),
  };

  // NOTE: Tree.Index public surface not available here; using View temporarily (Phase-1).
  const elTreePane = <Tree.Index.View theme={theme.name} root={root} minWidth={0} />;
  const elEmpty = !children && <div className={styles.empty.class}>{'No content to display.'}</div>;
  const elContentPane = !elEmpty && <div className={styles.content.class}>{children}</div>;

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <SplitPane
        debug={debug}
        theme={theme.name}
        orientation={'horizontal'}
        value={split}
        onChange={(e) => props.onSplitChange?.({ split: e.ratios })}
      >
        {elTreePane}
        {elEmpty || elContentPane}
      </SplitPane>
    </div>
  );
};
