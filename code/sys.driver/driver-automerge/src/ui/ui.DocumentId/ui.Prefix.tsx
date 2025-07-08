import React from 'react';
import { type t, Button, Color, css, D, Icons, usePointer } from './common.ts';
import { DocUrl } from './u.DocUrl.ts';
import { useKeyboard } from './use.Keyboard.ts';

type P = PrefixProps;

export type PrefixProps = {
  docId?: string;
  doc?: t.CrdtRef;
  over?: boolean;
  enabled?: boolean;
  readOnly?: boolean;
  icon?: t.DocumentIdHook['transient']['kind'];
  url?: t.DocumentIdHookProps['url'];
  urlKey?: t.DocumentIdHookProps['urlKey'];
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  //
  onCopy?: (e: { mode: 'id' | 'url' }) => void;
  onPointer?: t.PointerEventsHandler;
};

/**
 * Component:
 */
export const Prefix: React.FC<P> = (props) => {
  const { doc, enabled = D.enabled, url = D.url, urlKey = D.urlKey } = props;
  const docId = (props.docId || '').trim();
  const copied = wrangle.copied(props);
  const is = { current: doc && docId ? doc.id === docId : false };

  /**
   * Hooks:
   */
  const keyboard = useKeyboard();
  const pointer = usePointer(props.onPointer);

  /**
   * Handlers:
   */
  const handleCopy = () => {
    const mode = !!(keyboard.isUrlMode && url) ? 'url' : 'id';
    props.onCopy?.({ mode });
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const href = DocUrl.resolve(props.url, docId, urlKey);
    if (!href) {
      e.preventDefault();
      return;
    }

    const dt = e.dataTransfer;

    // Primary payload — required by Finder & spec-conformant apps.
    dt.setData('text/uri-list', `${href}\r\n`); // CRLF terminator.

    // Universal fallback — used by Chrome/Brave bookmark bars.
    dt.setData('text/plain', href);

    // Optional rich-text payload (safe to keep even with no title).
    dt.setData('text/html', `<a href="${href}">${href}</a>`);

    // Let the OS know a copy is allowed so Finder materialises a file.
    dt.effectAllowed = 'copyLink'; // 'copy' alone also fine
    dt.dropEffect = 'copy'; // cosmetic cursor feedback
  };

  /**
   * Render:
   */
  const CopyIcon = wrangle.copyIcon(props, keyboard.isUrlMode);
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
    btn: {
      base: css({ display: 'grid' }),
      body: css({ display: 'grid' }),
    },
    icon: css({
      opacity: is.current ? 1 : 0.25,
      transition: `opacity 120ms ease`,
    }),
  };

  const elCopy = docId && ((props.over && pointer.is.over) || copied) && (
    <Button enabled={enabled} style={styles.btn.base} onClick={handleCopy}>
      <div
        className={styles.btn.body.class}
        draggable
        onDragStart={onDragStart}
        onPointerDownCapture={(e) => e.stopPropagation()} // NB: prevent other handlers cancelling the event.
        onMouseDownCapture={(e) => e.stopPropagation()} //   NB: for Sarafi.
      >
        <CopyIcon size={18} color={props.over ? Color.BLUE : theme.fg} />
      </div>
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
  copyIcon(props: P, isUrlMode: boolean) {
    const copied = wrangle.copied(props);
    if (copied) return Icons.Copy.Tick;
    const { url = D.url } = props;
    return isUrlMode && !!url ? Icons.Copy.Plus : Icons.Copy.Basic;
  },
  databaseIcon(props: P) {
    const error = props.icon === 'Error';
    return error ? Icons.Warning : Icons.Database;
  },
} as const;
