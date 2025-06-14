import React from 'react';
import { type t, Color, css, D, Spinners } from './common.ts';

export type SuffixProps = {
  spinning?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Suffix: React.FC<SuffixProps> = (props) => {
  let spinning = props.spinning ?? D.spinning;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      width: 35,
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
      paddingBottom: 1,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {spinning && <Spinners.Bar theme={theme.name} width={18} />}
    </div>
  );
};
