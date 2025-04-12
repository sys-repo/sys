import React from 'react';
import { type t, Color, Cropmarks, css, Icons } from './common.ts';

type P = t.LayoutIntermediateProps;

/**
 * Component:
 */
export const LayoutIntermediate: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;
  if (!p) return null;

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      userSelect: 'none',
      display: 'grid',
    }),
    body: css({
      Padding: [20, 40],
      lineHeight: 1.5,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={'Dark'} borderOpacity={0.05}>
        <div className={styles.body.class}>
          <Icons.ProjectorScreen size={50} />
          <p>
            Please make your window bigger, or
            <br />
            move over to your mobile device.
          </p>
        </div>
      </Cropmarks>
    </div>
  );
};
