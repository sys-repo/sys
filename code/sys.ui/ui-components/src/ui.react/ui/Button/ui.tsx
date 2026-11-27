import { type FC, useEffect, useRef, useState } from 'react';

import { Color, css, D, Is, Signal, Style, type t } from './common.ts';
import { Event, type PressState, toEventState } from './u.events.ts';
import { controlFocus } from '../../../m.style/m.FocusStyle/u.controlFocus.ts';
import { useFocusBox } from '../../use.FocusBox.ts';
import { Wrangle } from './u.ts';

type P = t.Button.Props;
const focusStyle = controlFocus('--sys-button-focus');

/**
 * Component
 */
export const Button: FC<P> = (props) => {
  const {
    active = D.active,
    block = D.block,
    userSelect = D.userSelect,
    pressedOffset = D.pressedOffset,
  } = props;
  const enabled = Wrangle.enabled(props);
  const label = wrangle.label(props);

  /**
   * Hooks:
   */
  const press = useRef<PressState>({ mouse: false });
  const overState = useState(false);
  const downState = useState(false);
  const keyboardDownState = useState(false);
  const [over, setOver] = overState;
  const [down] = downState;
  const [keyboardDown] = keyboardDownState;

  const eventState = toEventState(props, overState, downState, keyboardDownState, press.current);
  const is: t.Button.Flags = { over, down: down || keyboardDown, enabled, disabled: !enabled };
  const opacity = wrangle.opacity(props, is);

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => props.subscribe?.());
  useEffect(() => {
    if (!active || !enabled) Event.reset(eventState);
    if (!active) setOver(false);
  }, [active, enabled]);

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
      cursor: enabled && active ? 'pointer' : 'default',
      userSelect: userSelect ? 'auto' : 'none',
    }),
    body: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      color: wrangle.color({
        enabled,
        accent: active && props.tone === 'accent',
        over: !!(over || props.isOver),
        dark: theme.is.dark,
      }),
      transform: wrangle.pressedOffset({
        enabled,
        // A held key supplies press feedback without changing physical hover truth.
        over: !!(over || props.isOver || keyboardDown),
        down: !!(is.down || props.isDown),
        pressedOffset,
      }),
      opacity: 1,
      // Preserve the filter's containing-block behavior, even at zero strength.
      filter: 'blur(0px) grayscale(0%)',
      transition: 'opacity 0.1s ease',
    }),
  };

  const rootStyle = focusStyle(styles.base, props.style);
  const { ref, indicator } = useFocusBox(rootStyle.compact);

  return (
    <div
      role='button'
      ref={ref}
      tabIndex={enabled && active ? 0 : -1}
      aria-disabled={!enabled || !active ? true : undefined}
      aria-pressed={props['aria-pressed']}
      aria-expanded={props['aria-expanded']}
      aria-controls={props['aria-controls']}
      aria-describedby={props['aria-describedby']}
      className={rootStyle.class}
      title={props.tooltip}
      {...Event.handlers(eventState)}
    >
      <div className={styles.body.class}>
        {label && <div>{label}</div>}
        {props.children}
      </div>
      {indicator}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  color(args: { enabled: boolean; accent: boolean; over: boolean; dark: boolean }) {
    const { enabled, accent, over, dark } = args;
    const neutral = dark ? Color.WHITE : Color.DARK;
    if (!enabled) return neutral;
    if (accent) return dark ? Color.lighten(Color.BLUE, 10) : Color.darken(Color.BLUE, 10);
    return over ? Color.BLUE : neutral;
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
    return Is.func(label) ? label() : label;
  },

  opacity(props: P, is: t.Button.Flags): t.Percent {
    const { opacity } = props;
    if (Is.number(opacity)) return opacity;
    if (Is.func(opacity)) return opacity({ is });
    return is.enabled ? D.opacity.enabled : props.disabledOpacity ?? D.opacity.disabled;
  },
} as const;
