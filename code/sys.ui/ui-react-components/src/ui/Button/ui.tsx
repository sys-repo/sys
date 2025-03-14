import React, { useEffect, useState } from 'react';
import { type t, Color, css, DEFAULTS, Style } from './common.ts';

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
  // const isBlurred = !!(spinning || overlay);
  const isBlurred = false;
  const isEnabled = enabled;
  // const spinner = Wrangle.spinner(props.spinner);

  const [isOver, setOver] = useState(false);
  const [isDown, setDown] = useState(false);

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
   * Handlers
   */
  const over = (isOver: boolean): React.MouseEventHandler => {
    return (e) => {
      if (!active) return;
      setOver(isOver);
      if (!isOver && isDown) setDown(false);
      if (enabled) {
        if (isOver && props.onMouseEnter) props.onMouseEnter(e);
        if (!isOver && props.onMouseLeave) props.onMouseLeave(e);
      }
      props.onMouse?.({
        event: e,
        isOver,
        isDown: !isOver ? false : isDown,
        isEnabled,
        action: isOver ? 'MouseEnter' : 'MouseLeave',
      });
    };
  };

  const down = (isDown: boolean): React.MouseEventHandler => {
    return (e) => {
      if (!active) return;
      setDown(isDown);
      if (enabled) {
        if (isDown && props.onMouseDown) props.onMouseDown(e);
        if (!isDown && props.onMouseUp) props.onMouseUp(e);
        if (!isDown && props.onClick && !isBlurred) props.onClick(e);
      }
      props.onMouse?.({
        event: e,
        isOver,
        isDown,
        isEnabled,
        action: isDown ? 'MouseDown' : 'MouseUp',
      });
    };
  };

  /**
   * Render
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
      onMouseEnter={over(true)}
      onMouseLeave={over(false)}
      onMouseDown={down(true)}
      onMouseUp={down(false)}
      onDoubleClick={props.onDoubleClick}
    >
      <div className={styles.body.class}>
        {props.label && <div>{props.label}</div>}
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
} as const;
