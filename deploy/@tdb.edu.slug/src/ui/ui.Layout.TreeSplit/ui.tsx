import React from 'react';
import { type t, Color, css, D, SplitPane, Tree } from './common.ts';

export const LayoutTreeSplit: React.FC<t.LayoutTreeSplitProps> = (props) => {
  const { debug = false, children, split = D.split, root } = props;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
      color: theme.fg,
      backgroundColor: debug ? Color.ruby(0.04) : undefined,
    }),
    body: css({ display: 'grid', minWidth: 0, minHeight: 0 }),
    empty: css({
      minHeight: 120,
      display: 'grid',
      placeItems: 'center',
      color: theme.fg,
      opacity: 0.65,
      fontSize: 13,
    }),
  };

  const empty = (msg: string) => <div className={styles.empty.class}>{msg}</div>;
  const elTreeEmpty = !root && empty('No tree loaded');
  const elBodyEmpty = !children && empty('No content to display');

  const elTreePane = !elTreeEmpty && (
    <Tree.Index.View
      theme={theme.name}
      root={root}
      minWidth={0}
      path={props.path}
      onPressDown={(e) => {
        if (!e.hasChildren) return;
        props.onPathChange?.({ path: e.node.path });
      }}
    />
  );

  const elBody = !elBodyEmpty && <div className={styles.body.class}>{children}</div>;

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <SplitPane
        debug={debug}
        theme={theme.name}
        orientation={'horizontal'}
        value={split}
        onChange={(e) => props.onSplitChange?.({ split: e.ratios })}
      >
        {elTreeEmpty || elTreePane}
        {elBodyEmpty || elBody}
      </SplitPane>
    </div>
  );
};
