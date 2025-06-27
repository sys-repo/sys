import React from 'react';
import { type t, Button, Color, css, D, Icons, usePointer } from './common.ts';
import { useKeyboard } from './use.Keyboard.ts';

export type PrefixProps = {
  docId?: string;
  doc?: t.CrdtRef;
  over?: boolean;
  enabled?: boolean;
  readOnly?: boolean;
  icon?: t.DocumentIdHook['transient']['kind'];
  urlSupport?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  //
  onCopy?: (e: { url: boolean }) => void;
  onPointer?: t.PointerEventsHandler;
};
type P = PrefixProps;

/**
 * Component:
 */
export const Prefix: React.FC<P> = (props) => {
  const { doc, enabled = D.enabled, urlSupport = D.urlSupport } = props;
  const docId = (props.docId || '').trim();
  const copied = wrangle.copied(props);
  const is = {
    current: doc && docId ? doc.id === docId : false,
  };

  /**
   * Hooks:
   */
  const keyboard = useKeyboard();
  const pointer = usePointer(props.onPointer);

  /**
   * Handlers:
   */
  const handleCopy = () => {
    const url = keyboard.urlMode && urlSupport;
    props.onCopy?.({ url });
  };

  /**
   * Render:
   */
  const CopyIcon = wrangle.copyIcon(props, keyboard.urlMode);
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

  const elCopy = docId && ((props.over && pointer.is.over) || copied) && (
    <Button enabled={enabled} style={styles.btn} onClick={handleCopy}>
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
  copied(props: P) {
    return props.icon === 'Copy';
  },
  copyIcon(props: P, urlMode: boolean) {
    const copied = wrangle.copied(props);
    if (copied) return Icons.Copy.Tick;
    const { urlSupport = D.urlSupport } = props;
    return urlMode && urlSupport ? Icons.Copy.Plus : Icons.Copy.Basic;
  },
  databaseIcon(props: P) {
    const error = props.icon === 'Error';
    return error ? Icons.Warning : Icons.Database;
  },
} as const;
