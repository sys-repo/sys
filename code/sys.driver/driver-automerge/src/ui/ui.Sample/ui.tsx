import React from 'react';

import { type t, Color, css, Input, ObjectView } from './common.ts';
import { SyncServer } from './ui.SyncServer.tsx';

export type SampleProps = {
  syncServer?: { url?: t.StringUrl; enabled?: boolean };
  repo?: t.CrdtRepo;
  docId?: t.Signal<t.StringId | undefined>;
  doc?: t.Signal<t.CrdtRef | undefined>;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  //
  onActionClick?: () => void;
  onDocIdTextChange?: t.TextInputChangeHandler;
  onSyncServerEnabledChange?: (e: { next: boolean }) => void;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { debug = false, repo, doc, syncServer = {} } = props;
  const current = doc?.value?.current;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, padding: 25, fontSize: 11 }),
    docInput: css({ Absolute: [-30, 0, null, 0] }),
    doc: css({ opacity: current === undefined ? 0.25 : 1 }),
    syncServer: css({ Absolute: [null, null, -25, 7] }),
  };

  const elSyncServer = (
    <SyncServer
      style={styles.syncServer}
      endpoint={syncServer.url}
      enabled={syncServer.enabled}
      theme={theme.name}
      peerId={repo?.id.peer}
      onEnabledChange={props.onSyncServerEnabledChange}
    />
  );

  const elDocumentId = (
    <Input.DocumentId.View
      theme={theme.name}
      style={styles.docInput}
      buttonStyle={{ margin: 1 }}
      controller={{
        repo,
        signals: { doc, id: props.docId },
        initial: { count: 0, text: '' },
      }}
    />
  );

  const elDoc = (
    <ObjectView
      name={'T:Memory<Crdt>'}
      data={current}
      expand={1}
      fontSize={24}
      theme={theme.name}
      style={styles.doc}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elSyncServer}
      {elDocumentId}
      {elDoc}
    </div>
  );
};
