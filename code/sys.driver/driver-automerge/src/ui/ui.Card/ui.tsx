import React from 'react';
import { SyncEnabledSwitch } from '../ui.Repo/mod.ts';

import { type t, Color, css, D, DocumentId, ObjectView, Str } from './common.ts';
import { FooterTools } from './ui.FooterTools.tsx';
import { useLocalStorage } from './use.LocalStorage.ts';

type P = t.CardProps;

export const Card: React.FC<P> = (props) => {
  const { debug = false, repo, signals = {}, sync, headerStyle = {} } = props;
  const doc = signals.doc;
  const current = doc?.value?.current;

  const [isHead, setHead] = React.useState(false);
  const store = useLocalStorage(props.localstorageKey);

  /**
   * TODO 🐷
   * save "syncing" switch state.
   */

  /**
   * Hooks:
   */
  const [, setRender] = React.useState(0);
  const redraw = () => setRender((n) => n + 1);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      fontSize: 11,
      display: 'grid',
      gridTemplateRows: `auto 1fr auto`,
    }),
    header: css({
      marginTop: headerStyle.topOffset,
    }),
    objectDoc: css({
      opacity: current === undefined || !isHead ? 0.25 : 1,
      Margin: 30,
    }),
    footer: css({
      height: 30,
      Padding: [6, 10, 8, 10],
      borderTop: `dashed 1px ${Color.alpha(theme.fg, 0.2)}`,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
    }),
    empty: css({ placeItems: 'center', display: 'grid', opacity: 0.5, userSelect: 'none' }),
  };

  const elFooter = (
    <div className={styles.footer.class}>
      <SyncEnabledSwitch
        endpoint={sync?.url}
        enabled={sync?.enabled}
        theme={theme.name}
        peerId={repo?.id.peer}
        onChange={(e) => props.onSyncEnabledChange?.(e)}
      />
      <div />
      <FooterTools theme={theme.name} doc={doc?.value} />
    </div>
  );

  const elDocumentId = (
    <DocumentId.View
      theme={theme.name}
      style={styles.header}
      buttonStyle={{ marginRight: 1, marginBottom: 2 }}
      background={-0.04}
      controller={{
        repo,
        signals: { doc, docId: props.signals?.docId },
        initial: { count: 0 },
        localstorageKey: props.localstorageKey,
      }}
      // Mounted:
      onReady={(e) => {
        redraw();
        props.onReady?.(e);
      }}
      onChange={(e) => {
        redraw();
        props.onChange?.(e);
        setHead(e.isHead);
      }}
    />
  );

  const elDoc = (
    <ObjectView
      name={'Doc:T'}
      data={wrangle.data(props)}
      expand={1}
      fontSize={28}
      theme={theme.name}
      style={styles.objectDoc}
    />
  );

  if (!repo)
    return (
      <div className={css(styles.empty, props.style).class} title={D.displayName}>
        {'(repository not provided)'}
      </div>
    );

  return (
    <div className={css(styles.base, props.style).class}>
      {elDocumentId}
      {elDoc}
      {elFooter}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  data(props: P) {
    const doc = props.signals?.doc?.value?.current;
    if (doc?.text == null) return doc;

    const { textMaxLength = 16 } = props;
    let text = (doc?.text ?? '') as string;
    if (text) text = Str.shorten(text, textMaxLength);

    return { ...doc, text };
  },
} as const;
