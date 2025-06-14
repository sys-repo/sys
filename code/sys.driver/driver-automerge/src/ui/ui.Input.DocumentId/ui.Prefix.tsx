import React from 'react';
import { type t, Color, css, Icons } from './common.ts';

export type PrefixProps = {
  repo?: t.CrdtRepo;
  doc?: t.CrdtRef;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Prefix: React.FC<PrefixProps> = (props) => {
  const { repo, doc } = props;
  const hasData = repo && doc;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
      paddingLeft: 5,
      paddingRight: 1,
    }),
    icon: css({
      opacity: hasData ? 1 : 0.3,
      transition: `opacity 120ms ease`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Icons.Database color={theme.fg} size={18} style={styles.icon} />
    </div>
  );
};
