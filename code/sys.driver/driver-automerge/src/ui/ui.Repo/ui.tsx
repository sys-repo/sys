import React from 'react';
import { type t, Color, css, D } from './common.ts';

import { useRepo } from './use.Repo.ts';

export const Repo: React.FC<t.RepoProps> = (props) => {
  const { debug = false } = props;

  const hook = useRepo();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ${D.displayName}`}</div>
    </div>
  );
};
