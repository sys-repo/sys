import React from 'react';
import { type t, Color, css, D, DocumentId, ObjectView, Repo, Str } from './common.ts';
import { FooterTools } from './ui.FooterTools.tsx';

type P = t.CardProps;

export const Card: React.FC<P> = (props) => {
  const { debug = false, factory, headerStyle = {}, localstorageKey } = props;

  /**
   * Hooks:
   */
  const [isHead, setHead] = React.useState(false);
  const [, setRender] = React.useState(0);
  const redraw = () => setRender((n) => n + 1);

  const crdt = Repo.useRepo({ factory, signals: props.signals, localstorageKey });
  const controller = DocumentId.useController({
    repo: crdt.repo,
    signals: props.signals,
    initial: { count: 0 },
    localstorageKey: props.localstorageKey,
  });

  const signals = { ...crdt.signals, ...controller.signals };
  const docSignal = signals.doc;
  const doc = docSignal.value;
  const current = doc?.current;

  /**
   * Handlers:
   */
  const fireChanged = () => {
    redraw();
    props.onChange?.({ isHead, signals });
  };

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
    header: css({ marginTop: headerStyle.topOffset }),
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
    empty: css({
      placeItems: 'center',
      display: 'grid',
      opacity: 0.5,
      userSelect: 'none',
    }),
  };

  const elFooter = (
    <div className={styles.footer.class}>
      <Repo.SyncEnabledSwitch
        endpoint={props.syncUrl}
        enabled={signals.syncEnabled.value}
        theme={theme.name}
        peerId={crdt.repo?.id.peer}
        onChange={(e) => {
          if (signals.syncEnabled) signals.syncEnabled.value = e.enabled;
        }}
      />
      <div />
      <FooterTools theme={theme.name} doc={docSignal?.value} />
    </div>
  );

  const elDocumentId = (
    <DocumentId.View
      theme={theme.name}
      style={styles.header}
      buttonStyle={{ marginRight: 1, marginBottom: 2 }}
      background={-0.04}
      controller={controller}
      onChange={(e) => {
        setHead(e.is.head);
        fireChanged();
      }}
    />
  );

  const elDoc = (
    <ObjectView
      name={'Doc:T'}
      data={wrangle.data(props, docSignal?.value)}
      expand={1}
      fontSize={28}
      theme={theme.name}
      style={styles.objectDoc}
    />
  );

  if (!crdt.repo)
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
  data(props: P, doc?: t.CrdtRef) {
    const current = doc?.current;
    if (current?.text == null) return current;

    const { textMaxLength = 16 } = props;
    let text = (current?.text ?? '') as string;
    if (text) text = Str.shorten(text, textMaxLength);

    return { ...current, text };
  },
} as const;
