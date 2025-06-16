import React from 'react';

import { type t, Color, css, D, Input, ObjectView } from './common.ts';
import { FooterTools } from './ui.FooterTools.tsx';
import { SyncServer } from './ui.SyncServer.tsx';

export const Card: React.FC<t.CardProps> = (props) => {
  const { debug = false, repo, signals = {}, sync, headerStyle = {} } = props;
  const doc = signals.doc;
  const current = doc?.value?.current;

  /**
   * Hools:
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
    doc: css({
      opacity: current === undefined ? 0.25 : 1,
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
  };

  const elFooter = (
    <div className={styles.footer.class}>
      <SyncServer
        endpoint={sync?.url}
        enabled={sync?.enabled}
        theme={theme.name}
        peerId={repo?.id.peer}
        onSyncEnabledChange={props.onSyncEnabledChange}
      />
      <div />
      <FooterTools theme={theme.name} doc={doc?.value} />
    </div>
  );

  const elDocumentId = (
    <Input.DocumentId.View
      theme={theme.name}
      style={styles.header}
      buttonStyle={{ marginRight: 1, marginBottom: 2 }}
      background={-0.04}
      controller={{
        repo,
        signals: { doc, id: props.signals?.docId },
        initial: { count: 0 },
        localstorageKey: `dev:${D.name}.localstore`,
      }}
      // Mounted:
      onChange={(e) => {
        redraw();
        props.onChange?.(e);
      }}
      onReady={(e) => {
        redraw();
        props.onReady?.(e);
      }}
    />
  );

  const elDoc = (
    <ObjectView
      name={'Doc<T>'}
      data={current}
      expand={1}
      fontSize={28}
      theme={theme.name}
      style={styles.doc}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elDocumentId}
      {elDoc}
      {elFooter}
    </div>
  );
};
