import React from 'react';
import { type t, Color, css, ObjectView, P } from './common.ts';

type P = t.SampleProps;

/**
 * Component:
 */
export const Debug: React.FC<P> = (props) => {
  const { peer, doc } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
    body: css({
      position: 'relative',
      Scroll: true,
      Padding: [25, 30],
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <ObjectView
          theme={theme.name}
          name={'room'}
          data={{
            webrtc: peer,
            'doc.id': doc?.id,
            doc: doc?.current,
          }}
          expand={['$', '$.doc', '$.doc.connections', '$.doc.connections.group']}
        />
      </div>
    </div>
  );
};
