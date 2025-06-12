import React from 'react';
import { type t, Color, css, ObjectView } from './common.ts';
import { Uri } from './ui.Uri.tsx';
import { UrlTitle } from './ui.Url.Title.tsx';

export type SampleProps = {
  syncUrl?: t.StringUrl;
  doc?: t.CrdtRef;
  repo?: t.CrdtRepo;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { debug = false, repo, doc } = props;
  const peerId = repo?.id.peer;
  const docId = doc?.id ? `crdt:doc:${doc.id}` : undefined;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, padding: 25 }),
    title: css({ Absolute: [-30, 0, null, 0] }),
    docId: css({ Absolute: [null, null, -23, 10], fontSize: 11 }),
    peerId: css({ Absolute: [null, 10, -23, null], fontSize: 11 }),
  };

  const elTitle = <UrlTitle style={styles.title} url={props.syncUrl} />;

  const elDoc = <Uri text={docId} style={styles.docId} />;
  const elPeer = <Uri text={peerId} style={styles.peerId} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elTitle}
      {elDoc}
      {elPeer}
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
