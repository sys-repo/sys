import { COLORS, DEFAULTS, type t } from './common.ts';

export const Wrangle = {
  color(args: { isEnabled: boolean; isOver?: boolean; theme?: t.CommonTheme }) {
    const color = args.theme === 'Dark' ? COLORS.WHITE : COLORS.DARK;
    if (!args.isEnabled) return color;
    return args.isOver ? COLORS.BLUE : color;
  },

  pressedOffset(args: {
    isEnabled: boolean;
    isOver: boolean;
    isDown: boolean;
    pressedOffset: [number, number];
  }) {
    const { isEnabled, isOver, isDown, pressedOffset } = args;
    if (!isEnabled) return undefined;
    if (!isOver) return undefined;
    if (!isDown) return undefined;
    return `translateX(${pressedOffset[0]}px) translateY(${pressedOffset[1]}px)`;
  },

  spinner(input: t.ButtonProps['spinner']): t.ButtonSpinner {
    const DEFAULT = DEFAULTS.spinner;
    return {
      width: input?.width ?? DEFAULT.width,
      color: {
        enabled: input?.color?.enabled ?? DEFAULT.color.enabled,
        disabled: input?.color?.disabled ?? DEFAULT.color.disabled,
      },
    };
  },
} as const;
