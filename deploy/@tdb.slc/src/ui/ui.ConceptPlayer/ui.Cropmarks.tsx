import React from 'react';
import { type t, Cropmarks as BaseCropmarks, Color, css } from './common.ts';

export type CropmarksProps = {
  debug?: boolean;
  children?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Cropmarks: React.FC<CropmarksProps> = (props) => {
  const { debug = false } = props;
  const borderWidth = debug ? 1 : 0;
  const borderOpacity = debug ? 0.1 : 0.05;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
    inner: {
      base: css({ Absolute: 0, display: 'grid', pointerEvents: 'none' }),
      body: css({ width: 390, pointerEvents: 'auto' }),
    },
  };

  const elInner = (
    <div className={styles.inner.base.class}>
      <BaseCropmarks
        theme={theme.name}
        borderOpacity={borderOpacity}
        borderWidth={borderWidth}
        size={{ mode: 'fill', x: false, y: true, margin: [0, 40, 0, 40] }}
      >
        <div className={styles.inner.body.class}>{props.children}</div>
      </BaseCropmarks>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <BaseCropmarks
        theme={theme.name}
        borderWidth={borderWidth}
        borderOpacity={borderOpacity}
        size={{ mode: 'fill', margin: [46, 0, 0, 0], x: true, y: true }}
      >
        {elInner}
      </BaseCropmarks>
    </div>
  );
};
