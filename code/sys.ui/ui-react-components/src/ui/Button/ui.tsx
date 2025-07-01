import React, { useEffect, useState } from 'react';

import { type t, Color, css, D, Is, Signal, Style, useIsTouchSupported } from './common.ts';
import { Event, toEventState } from './u.events.ts';
import { Wrangle } from './u.ts';

type P = t.ButtonProps;

/**
 * Component
 */
export const Button: React.FC<P> = (props) => {
  const {
    active = D.active,
    block = D.block,
    userSelect = D.userSelect,
    pressedOffset = D.pressedOffset,
  } = props;
  const enabled = Wrangle.enabled(props);
  const label = wrangle.label(props);
  const blurred = false;

  /**
   * Hooks:
   */
  const isTouch = useIsTouchSupported();
  const overState = useState(false);
  const downState = useState(false);
  const [over, setOver] = overState;
  const [down, setDown] = downState;

  const eventState = toEventState(props, overState, downState);
  const is: t.ButtonFlags = { enabled, over, down };
  const opacity = wrangle.opacity(props, is);

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => props.subscribe?.());
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
      opacity: opacity,
      cursor: enabled && active && !blurred ? 'pointer' : 'default',
      userSelect: userSelect ? 'auto' : 'none',
    }),
    body: css({
      display: 'grid',
      color: wrangle.color({
        enabled,
        over: !!(over || props.isOver),
        theme: theme.name,
      }),
      transform: wrangle.pressedOffset({
        enabled,
        over: !!(over || props.isOver),
        down: !!(down || props.isDown),
        pressedOffset,
      }),
      opacity: blurred ? 0.15 : 1,
      filter: `blur(${blurred ? 3 : 0}px) grayscale(${blurred ? 100 : 0}%)`,
      transition: 'opacity 0.1s ease',
    }),
  };

  return (
    <div
      role={'button'}
      title={props.tooltip}
      className={css(styles.base, props.style).class}
      onDoubleClick={props.onDoubleClick}
      {...Event.handlers(eventState, isTouch)}
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
  color(args: { enabled: boolean; over?: boolean; theme?: t.CommonTheme }) {
    const color = args.theme === 'Dark' ? Color.WHITE : Color.DARK;
    if (!args.enabled) return color;
    return args.over ? Color.BLUE : color;
  },

  pressedOffset(args: {
    enabled: boolean;
    over: boolean;
    down: boolean;
    pressedOffset: [number, number];
  }) {
    const { enabled, over, down, pressedOffset } = args;
    if (!enabled) return undefined;
    if (!over) return undefined;
    if (!down) return undefined;
    return `translateX(${pressedOffset[0]}px) translateY(${pressedOffset[1]}px)`;
  },

  label(props: P) {
    const { label } = props;
    return typeof label === 'function' ? label() : label;
  },

  opacity(props: P, is: t.ButtonFlags): t.Percent {
    const { opacity } = props;
    if (Is.number(opacity)) return opacity;
    if (Is.func(opacity)) return opacity({ is });
    return is.enabled ? D.opacity.enabled : D.opacity.disabled;
  },
} as const;
