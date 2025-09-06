import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { useComponent } from './use.Component.tsx';

type P = t.BarSpinnerProps;

export const BarSpinner: React.FC<P> = (props) => {
  const { width = D.width, height } = props;
  const cssOverride = wrangle.cssOverride(props);

  const BarLoader = useComponent(async () => (await import('react-spinners')).BarLoader);
  if (!BarLoader) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 10,
      opacity: 0.5,
      width,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <BarLoader color={theme.fg} width={width} height={height} cssOverride={cssOverride} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  cssOverride(props: P): t.CssProps | undefined {
    const { transparentTrack = false } = props;
    if (!transparentTrack) return;
    return {
      backgroundColor: 'transparent',
      borderColor: 'transparent', // when < 5px height adds borders → remove this too.
    };
  },
} as const;
