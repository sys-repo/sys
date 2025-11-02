import React from 'react';
import { type t, Color, css } from './common.ts';
import { InfoPanel } from './ui.InfoPanel.tsx';

type P = t.SlugHarnessProps;

/**
 * Component:
 */
export const Sidebar: React.FC<P> = (props) => {
  const { debug = false, registry, signals, path } = props;
  const doc = signals?.doc.value;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      padding: 25,
      paddingTop: 20,
    }),
    body: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <InfoPanel theme={theme.name} registry={registry} doc={doc} path={path} />
      </div>
    </div>
  );
};
