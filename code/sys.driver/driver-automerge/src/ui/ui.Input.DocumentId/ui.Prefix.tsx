import React from 'react';
import { type t, Button, Color, css, Icons } from './common.ts';

export type PrefixProps = {
  repo?: t.CrdtRepo;
  doc?: t.CrdtRef;
  //
  isOverParent?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Prefix: React.FC<PrefixProps> = (props) => {
  const { repo, doc, isOverParent: isOver } = props;
  const hasData = repo && doc;

  /**
   * Handlers
   */
  const copyToClipboard = () => {
    const id = doc?.id;
    if (id) navigator.clipboard.writeText(id);
  };

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
    btn: css({ display: 'grid' }),
    icon: css({
      opacity: hasData ? 1 : 0.3,
      transition: `opacity 120ms ease`,
    }),
  };

  const elCopy = doc && isOver && (
    <Button style={styles.btn} onClick={copyToClipboard}>
      <Icons.Copy color={theme.fg} size={18} />
    </Button>
  );
  const elDatabase = !elCopy && <Icons.Database color={theme.fg} size={18} style={styles.icon} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elCopy}
      {elDatabase}
    </div>
  );
};
