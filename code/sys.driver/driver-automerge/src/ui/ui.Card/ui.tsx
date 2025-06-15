import React from 'react';

import { type t, Color, css, D, Input, ObjectView } from './common.ts';
import { SyncServer } from './ui.SyncServer.tsx';
import { FooterTools } from './ui.FooterTools.tsx';

export type SampleProps = {
  syncServer?: { url?: t.StringUrl; enabled?: boolean };
  repo?: t.CrdtRepo;
  docId?: t.Signal<t.StringId | undefined>;
  doc?: t.Signal<t.CrdtRef | undefined>;

  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  headerStyle?: { topOffset?: number };

  //
  onActionClick?: () => void;
  onDocIdTextChange?: t.TextInputChangeHandler;
  onSyncEnabledChange?: (e: { next: boolean }) => void;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { debug = false, repo, doc, syncServer = {} } = props;
  const current = doc?.value?.current;

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
      marginTop: props.headerStyle?.topOffset,
    }),
    doc: css({
      opacity: current === undefined ? 0.25 : 1,
      Margin: 30,
    }),
    footer: css({
      Padding: [6, 10],
      borderTop: `dashed 1px ${Color.alpha(theme.fg, 0.1)}`,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
  };

  const elFooter = (
    <div className={styles.footer.class}>
      <SyncServer
        endpoint={syncServer.url}
        enabled={syncServer.enabled}
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
        signals: { doc, id: props.docId },
        initial: { count: 0, text: '' },
        localstorageKey: `dev:${D.name}.localstore`,
      }}
    />
  );

  const elDoc = (
    <ObjectView
      name={'Memory<T>'}
      data={current}
      expand={1}
      fontSize={24}
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
