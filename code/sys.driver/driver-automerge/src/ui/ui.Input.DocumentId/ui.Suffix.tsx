import React from 'react';
import { type t, Color, css, Icons, Spinners } from './common.ts';

export type SuffixProps = {
  spinning?: boolean;
  doc?: t.CrdtRef;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Suffix: React.FC<SuffixProps> = (props) => {
  const { spinning = false, doc } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      width: 30,
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {spinning && <Spinners.Bar theme={theme.name} width={18} />}
      {!spinning && doc && <Icons.Database color={theme.fg} size={18} />}
    </div>
  );
};
