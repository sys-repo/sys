import React from 'react';
import { type t, Cropmarks, css, TooSmall } from './common.ts';

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
    base: css({ position: 'relative', userSelect: 'none', display: 'grid' }),
    body: css({}),
  };

  const msg = `
  Please make your window bigger, or
  move over to your mobile device.
  `;

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={'Dark'} borderOpacity={0.05}>
        <div className={styles.body.class}>
          <TooSmall theme={props.theme}>{msg}</TooSmall>
        </div>
      </Cropmarks>
    </div>
  );
};
