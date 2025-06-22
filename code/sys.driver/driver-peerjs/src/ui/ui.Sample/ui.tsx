import React from 'react';
import { type t, ObjectView, Crdt, Color, css, D } from './common.ts';
import { MdNoCell } from 'react-icons/md';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, doc, peerjs } = props;

  /**
   * Effects:
   */
  Crdt.UI.useRedrawEffect(doc);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 40,
    }),
    obj: css({ marginTop: 15 }),
  };

  const elDebug = debug && (
    <ObjectView
      theme={theme.name}
      name={'debug'}
      data={{ doc: doc?.current, peerjs }}
      style={styles.obj}
      expand={1}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ${D.displayName}`}</div>
      {elDebug}
    </div>
  );
};
