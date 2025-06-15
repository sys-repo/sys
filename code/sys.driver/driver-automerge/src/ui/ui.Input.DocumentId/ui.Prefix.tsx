import React from 'react';
import { type t, Button, Color, css, Icons, usePointer } from './common.ts';

export type PrefixProps = {
  docId?: string;
  over?: boolean;
  copied?: boolean;
  enabled?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  //
  onPointer?: t.PointerEventsHandler;
  onCopied?: () => void;
};

/**
 * Component:
 */
export const Prefix: React.FC<PrefixProps> = (props) => {
  const { copied, over, enabled = true } = props;
  const docId = (props.docId || '').trim();

  const CopyIcon = copied ? Icons.Tick : Icons.Copy;

  /**
   * Hooks:
   */
  const pointer = usePointer(props.onPointer);

  /**
   * Handlers:
   */
  const copyToClipboard = () => {
    if (docId) navigator.clipboard.writeText(docId);
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
    icon: css({ opacity: !!docId ? 1 : 0.25, transition: `opacity 120ms ease` }),
  };

  const elCopy = docId && over && (
    <Button enabled={enabled} style={styles.btn} onClick={copyToClipboard}>
      <CopyIcon size={18} color={over ? Color.BLUE : theme.fg} />
    </Button>
  );
  const elDatabase = !elCopy && <Icons.Database color={theme.fg} size={18} style={styles.icon} />;

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      {elCopy}
      {elDatabase}
    </div>
  );
};
