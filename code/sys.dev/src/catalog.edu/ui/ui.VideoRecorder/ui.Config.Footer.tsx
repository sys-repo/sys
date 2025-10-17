import React from 'react';
import { type t, Color, Crdt, css, D } from './common.ts';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Footer: React.FC<P> = (props) => {
  const { debug = false, repo, documentId } = props;
  const storageKey = documentId?.localstorage ?? D.documentId.localstorage;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      Padding: [10, 10],
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
    left: css({}),
    right: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.left.class}></div>
      <div />
      <div className={styles.right.class}>
        <Crdt.UI.Repo.SyncEnabledSwitch
          repo={repo}
          localstorage={storageKey}
          mode={'switch + network-icons'}
          theme={theme.name}
        />
      </div>
    </div>
  );
};
