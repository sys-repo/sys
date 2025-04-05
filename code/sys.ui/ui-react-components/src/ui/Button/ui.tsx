import React, { useEffect, useState } from 'react';
import { type t, Color, css, DEFAULTS, Style, useIsTouchSupported } from './common.ts';
import { Event, toEventState } from './u.events.ts';

type P = t.ButtonProps;

/**
 * Component
 */
export const Button: React.FC<P> = (props) => {
  const {
    enabled = DEFAULTS.enabled,
    active = DEFAULTS.active,
    block = DEFAULTS.block,
    disabledOpacity = DEFAULTS.disabledOpacity,
    userSelect = DEFAULTS.userSelect,
    pressedOffset = DEFAULTS.pressedOffset,
  } = props;
  const isBlurred = false;
  const isEnabled = enabled;
  const label = wrangle.label(props);

  const over = useState(false);
  const down = useState(false);
  const [isOver, setOver] = over;
  const [isDown, setDown] = down;

  const isMobile = useIsTouchSupported();
  const eventState = toEventState(props, over, down);

  /**
   * Lifecycle
   */
  useEffect(() => {
    if (!active) {
      setDown(false);
      setOver(false);
    }
  }, [active]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      ...Style.toMargins(props.margin),
      ...Style.toPadding(props.padding),
      position: 'relative',
      display: block ? 'block' : 'inline-block',
      minWidth: props.minWidth,
      maxWidth: props.maxWidth,
      opacity: enabled ? 1 : disabledOpacity,
      cursor: enabled && active && !isBlurred ? 'pointer' : 'default',
      userSelect: userSelect ? 'auto' : 'none',
    }),
    body: css({
      color: wrangle.color({
        isEnabled,
        isOver: !!(isOver || props.isOver),
        theme: theme.name,
      }),
      transform: wrangle.pressedOffset({
        isEnabled,
        isOver: !!(isOver || props.isOver),
        isDown: !!(isDown || props.isDown),
        pressedOffset,
      }),
      opacity: isBlurred ? 0.15 : 1,
      filter: `blur(${isBlurred ? 3 : 0}px) grayscale(${isBlurred ? 100 : 0}%)`,
      transition: 'opacity 0.1s ease',
    }),
  };

  return (
    <div
      className={css(styles.base, props.style).class}
      role={'button'}
      title={props.tooltip}
      onDoubleClick={props.onDoubleClick}
      {...Event.handlers(eventState, isMobile)}
    >
      <div className={styles.body.class}>
        {label && <div>{label}</div>}
        {props.children}
      </div>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  color(args: { isEnabled: boolean; isOver?: boolean; theme?: t.CommonTheme }) {
    const color = args.theme === 'Dark' ? Color.WHITE : Color.DARK;
    if (!args.isEnabled) return color;
    return args.isOver ? Color.BLUE : color;
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

  label(props: P) {
    const { label } = props;
    return typeof label === 'function' ? label() : label;
  },
} as const;
