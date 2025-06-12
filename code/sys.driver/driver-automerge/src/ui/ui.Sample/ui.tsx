import React from 'react';

import { type t, Color, css, ObjectView } from './common.ts';
import { DocTextbox } from './ui.DocTextbox.tsx';
import { UrlTitle } from './ui.Title.tsx';
import { Uri } from './ui.Uri.tsx';

export type SampleProps = {
  syncUrl?: t.StringUrl;
  docId?: string;
  doc?: t.CrdtRef;
  repo?: t.CrdtRepo;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onActionClick?: () => void;
  onDocIdTextChange?: t.TextInputChangeHandler;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { debug = false, repo, doc } = props;
  const peerId = repo?.id.peer;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, padding: 25, fontSize: 11 }),
    title: css({ Absolute: [null, null, -22, 10] }),
    peerId: css({ Absolute: [null, 10, -22, null] }),
    textbox: css({ Absolute: [-31, 0, null, 0] }),
  };

  const elTitle = <UrlTitle style={styles.title} url={props.syncUrl} />;
  const elPeer = <Uri prefix={'peer-id: “'} text={peerId} suffix={'”'} style={styles.peerId} />;
  const elDocTextbox = (
    <DocTextbox
      docId={props.docId}
      theme={theme.name}
      style={styles.textbox}
      onCreateNew={props.onActionClick}
      onTextChange={props.onDocIdTextChange}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elTitle}
      {elPeer}
      {elDocTextbox}
      <ObjectView
        name={'T:CrdtRef'}
        data={doc?.current}
        expand={1}
        fontSize={24}
        theme={theme.name}
      />
    </div>
  );
};
