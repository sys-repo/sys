import React from 'react';
import { type t, Color, Crdt, css } from './common.ts';
import { headerConfig } from './u.ts';

type P = t.CrdtLayoutProps;

/**
 * Component:
 */
export const Header: React.FC<P> = (props) => {
  const { debug = false, repo, signals } = props;
  const config = headerConfig(props.header);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    doc: css({
      height: config.visible ? undefined : 0,
      overflow: 'hidden',
    }),
  };

  const elDoc = (
    <div className={styles.doc.class}>
      <Crdt.UI.DocumentId.View
        background={theme.is.dark ? -0.06 : -0.04}
        theme={theme.name}
        buttonStyle={{ margin: 4 }}
        controller={{
          repo,
          signals: signals ? { doc: signals.doc } : undefined,
          initial: {},
          localstorage: config.localstorage,
          urlKey: config.urlKey,
          readOnly: config.readOnly,
        }}
      />
    </div>
  );

  return <div className={css(styles.base, props.style).class}>{elDoc}</div>;
};
