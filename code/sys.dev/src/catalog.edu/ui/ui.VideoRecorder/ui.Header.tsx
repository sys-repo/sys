import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, Crdt, css, D, Rx, Signal } from './common.ts';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Header: React.FC<P> = (props) => {
  const { debug = false, repo, signals = {} } = props;

  const DOC = {
    visible: props.documentId?.visible ?? D.documentId.visible,
    readOnly: props.documentId?.readOnly ?? D.documentId.readOnly,
    localstorage: props.documentId?.localstorage,
    urlKey: props.documentId?.urlKey,
  } as const;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    documentId: css({
      height: DOC.visible ? undefined : 0,
      overflow: 'hidden',
    }),
  };

  const elDocumentId = (
    <div className={styles.documentId.class}>
      <Crdt.UI.DocumentId.View
        background={theme.is.dark ? -0.06 : -0.04}
        theme={theme.name}
        buttonStyle={{ margin: 4 }}
        controller={{
          repo,
          signals: { doc: signals.doc },
          initial: {},
          localstorage: DOC.localstorage,
          urlKey: DOC.urlKey,
          readOnly: DOC.readOnly,
        }}
      />
    </div>
  );

  return <div className={css(styles.base, props.style).class}>{elDocumentId}</div>;
};
