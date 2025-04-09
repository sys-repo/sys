import React from 'react';
import { type t, css, Icons } from '../common.ts';

export type InstallProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Install: React.FC<InstallProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      userSelect: 'none',
      display: 'grid',
      justifyItems: 'center',
    }),
    label: css({ opacity: 0.2 }),
    icon: css({ Size: 44, display: 'grid', placeItems: 'center' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{`Install ( Application )`}</div>
      <div className={styles.icon.class}>
        <Icons.Arrow.Down />
      </div>
    </div>
  );
};
