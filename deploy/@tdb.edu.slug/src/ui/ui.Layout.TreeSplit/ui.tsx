import React from 'react';
import { type t, Color, css, D, SplitPane } from './common.ts';
import { Empty } from './ui.Empty.tsx';
import { Treeview } from './ui.Treeview.tsx';

export const LayoutTreeSplit: React.FC<t.LayoutTreeSplitProps> = (props) => {
  const { debug = false, children, split = D.split } = props;

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
  };

  const elTree = <Treeview {...props} />;
  const elBodyEmpty = <Empty theme={theme.name} children={'No content to display'} />;
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
        {elTree}
        {elBodyEmpty || elBody}
      </SplitPane>
    </div>
  );
};
