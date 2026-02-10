import React from 'react';
import { type t, Color, D, Is, Spinners, css } from './common.ts';

type Slot = t.TreeHostSpinnerSlot;
type Config = t.TreeHostSlotSpinner;
type Input = t.TreeHostProps['spinner'];

const defaults = {
  opacity: D.spinnerOpacity,
  backgroundBlur: D.spinnerBackgroundBlur,
  position: D.spinnerPosition,
} as const;

export type SpinningProps = {
  opacity?: number;
  backgroundBlur?: t.Pixels;
  position?: t.TreeHostSpinnerPosition;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Spinning: React.FC<SpinningProps> = (props) => {
  const position = props.position ?? D.spinnerPosition;
  const alignItems = position === 'top' ? 'start' : position === 'bottom' ? 'end' : 'center';
  const paddingTop = position === 'top' ? 28 : undefined;
  const paddingBottom = position === 'bottom' ? 28 : undefined;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      justifyItems: 'center',
      alignItems,
      paddingTop,
      paddingBottom,
      backgroundColor: Color.alpha(theme.bg, props.opacity ?? D.spinnerOpacity),
      backdropFilter: Is.num(props.backgroundBlur) ? `blur(${props.backgroundBlur}px)` : undefined,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-position={position}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );
};

/**
 * Helpers
 */
function normalizeOne(input: t.TreeHostSpinner): Config {
  if (typeof input === 'string') return { slot: input, ...defaults };
  return { ...defaults, ...input };
}

export function spinnerForSlot(input: Input, slot: Slot): Config | undefined {
  if (!input) return undefined;
  const list = Array.isArray(input) ? input : [input];
  const config = list.map(normalizeOne);
  return config.findLast((item) => {
    if (slot === 'tree' && item.slot === 'treeLeaf') return true;
    return item.slot === slot;
  });
}

export function contentStyle(config?: Config) {
  if (!config) return undefined;
  return {
    opacity: Is.num(config.opacity) ? config.opacity : defaults.opacity,
    filter: Is.num(config.backgroundBlur) ? `blur(${config.backgroundBlur}px)` : undefined,
  } as const;
}
