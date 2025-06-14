import React from 'react';
import { type t, Button, Color, css, Icons } from './common.ts';

export type PrefixProps = {
  doc?: t.CrdtRef;
  //
  over?: boolean;
  copied?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  //
  onCopied?: () => void;
};

/**
 * Component:
 */
export const Prefix: React.FC<PrefixProps> = (props) => {
  const { doc, copied, over } = props;
  const CopyIcon = copied ? Icons.Tick : Icons.Copy;

  /**
   * Handlers:
   */
  const copyToClipboard = () => {
    const id = doc?.id;
    if (id) navigator.clipboard.writeText(id);
    props.onCopied?.();
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
    icon: css({ opacity: !!doc ? 1 : 0.3, transition: `opacity 120ms ease` }),
  };

  const elCopy = doc && over && (
    <Button style={styles.btn} onClick={copyToClipboard}>
      <CopyIcon size={18} color={over ? Color.BLUE : theme.fg} />
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
