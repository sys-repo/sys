import React from 'react';
import { type t, Color, css, Slider } from './common.ts';

export type ToolbarProps = {
  percent: t.Percent;
  iconSize?: t.Pixels;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: t.SliderProps['onChange'];
};

/**
 * Component:
 */
export const Toolbar: React.FC<ToolbarProps> = (props) => {
  const { percent, iconSize } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      Padding: [15, 20],
      fontFamily: 'monospace',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      columnGap: 10,
    }),
    section: css({ display: 'grid', placeItems: 'center' }),
    slider: {
      base: css({
        display: 'grid',
        gridTemplateColumns: 'auto auto',
        alignItems: 'center',
        columnGap: 15,
      }),
      px: css({ fontSize: 16 }),
    },
  };

  const elSlider = (
    <Slider
      theme={theme.name}
      width={200}
      track={{ height: 5 }}
      thumb={{ size: 15 }}
      percent={percent}
      onChange={props.onChange}
    />
  );

  const elRight = (
    <div className={styles.slider.base.class}>
      {elSlider}
      <div className={styles.slider.px.class}>{`${iconSize}px`}</div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.section.class}>{}</div>
      <div className={styles.section.class}>{}</div>
      <div className={styles.section.class}>{elRight}</div>
    </div>
  );
};
