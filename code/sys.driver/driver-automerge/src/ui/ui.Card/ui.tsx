import React, { useState } from 'react';
import { type t, Color, css, D, DocumentId, ObjectView, Repo, Str } from './common.ts';
import { FooterTools } from './ui.FooterTools.tsx';

type O = Record<string, unknown>;
type P = t.CardProps;

export const Card: React.FC<P> = (props) => {
  const { debug = false, headerStyle = {}, localstorage, repo } = props;

  /**
   * Hooks:
   */
  const [head, setHead] = useState(false);
  const [current, setCurrent] = useState<O>();
  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  const controller = DocumentId.useController({
    repo,
    signals: props.signals,
    initial: { count: 0 },
    localstorage,
  });

  const signals = { ...controller.signals };
  const docSignal = signals.doc;
  const doc = docSignal.value;

  /**
   * Effect:
   */
  React.useEffect(() => void setCurrent(doc?.current), [doc?.id]);

  /**
   * Handlers:
   */
  const fireChanged = () => {
    redraw();
    if (repo) props.onChange?.({ is: { head }, signals, repo });
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
      opacity: current === undefined || !head ? 0.25 : 1,
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
        theme={theme.name}
        repo={repo}
        localstorage={localstorage}
        onChange={(e) => {}}
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
  data(props: P, doc?: t.CrdtRef) {
    const current = doc?.current;
    if (current?.text == null) return current;

    const { textMaxLength = 16 } = props;
    let text = (current?.text ?? '') as string;
    if (text) text = Str.shorten(text, textMaxLength);

    return { ...current, text };
  },
} as const;
