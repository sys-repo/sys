import React from 'react';
import { type t, Button, Color, css, Icons, usePointer } from './common.ts';

export type PrefixProps = {
  docId?: string;
  doc?: t.CrdtRef;
  over?: boolean;
  icon?: t.DocumentIdHook['transient']['kind'];
  enabled?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  //
  onCopy?: () => void;
  onPointer?: t.PointerEventsHandler;
};
type P = PrefixProps;

/**
 * Component:
 */
export const Prefix: React.FC<P> = (props) => {
  const { doc, enabled = true } = props;
  const docId = (props.docId || '').trim();
  const is = { current: doc && docId ? doc.id === docId : false } as const;

  /**
   * Hooks:
   */
  const pointer = usePointer(props.onPointer);

  /**
   * Render:
   */
  const CopyIcon = wrangle.copyIcon(props);
  const DatabaseIcon = wrangle.databaseIcon(props);
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
      opacity: is.current ? 1 : 0.25,
      transition: `opacity 120ms ease`,
    }),
  };

  const elCopy = docId && props.over && pointer.is.over && (
    <Button enabled={enabled} style={styles.btn} onClick={props.onCopy}>
      <CopyIcon size={18} color={props.over ? Color.BLUE : theme.fg} />
    </Button>
  );
  const elDatabase = !elCopy && <DatabaseIcon color={theme.fg} size={18} style={styles.icon} />;

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      {elCopy}
      {elDatabase}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  copyIcon(props: P) {
    const copied = props.icon === 'Copy';
    return copied ? Icons.Tick : Icons.Copy;
  },
  databaseIcon(props: P) {
    const error = props.icon === 'Error';
    return error ? Icons.Warning : Icons.Database;
  },
} as const;
