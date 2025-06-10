import React from 'react';
import { type t, Color, css, ObjectView } from './common.ts';
import { Uri } from './ui.Uri.tsx';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, repo } = props;
  const peerId = repo?.id.peer;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, padding: 10 }),
    peerId: css({ Absolute: [null, 10, -23, null], fontSize: 11 }),
  };

  const elPeer = <Uri text={peerId} style={styles.peerId} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elPeer}
      <ObjectView
        name={'T:SampleDoc'}
        data={props.doc}
        expand={1}
        fontSize={24}
        theme={theme.name}
      />
    </div>
  );
};
