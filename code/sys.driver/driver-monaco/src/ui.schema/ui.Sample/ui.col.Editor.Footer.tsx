import React from 'react';
import { type t, Color, css, Monaco } from './common.ts';

type P = t.SampleProps;

/**
 * Component:
 */
export const Footer: React.FC<P> = (props) => {
  const { debug = false, repo, signals } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.alpha(Color.BLACK, theme.is.dark ? 0.18 : 0.02),
      padding: 8,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Monaco.Dev.PathView
        prefix={'path:'}
        prefixColor={theme.is.dark ? Color.CYAN : Color.BLUE}
        path={signals.cursor.value}
        theme={theme.name}
      />
    </div>
  );
};
