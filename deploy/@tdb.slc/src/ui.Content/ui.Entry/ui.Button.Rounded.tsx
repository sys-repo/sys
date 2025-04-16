import React, { useEffect, useState } from 'react';
import { type t, Button, Color, css, Time } from './common.ts';

export type RoundedButtonProps = {
  label?: string;
  pulse?: boolean | Pulse;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: MouseHandler;
};

export type Pulse = { pulsing?: boolean; duration?: t.Msecs; opacity?: t.Percent };

type P = RoundedButtonProps;
type MouseHandler = React.MouseEventHandler;

/**
 * Component:
 */
export const RoundedButton: React.FC<P> = (props) => {
  const { label = 'Unnamed' } = props;
  const pulse = wrangle.pulse(props.pulse);

  const [isOver, setOver] = useState(false);
  const [pulseOpacity, setPulseOpacity] = useState(0); // New state for opacity pulsing

  /**
   * Effects:
   * When pulse is active (pulsing is true), set up a cycle that toggles the pulseOpacity value.
   */
  useEffect(() => {
    if (!pulse.pulsing) {
      setPulseOpacity(0);
      return;
    }

    const time = Time.until();
    const duration = pulse.duration;
    const toggleOpacity = () => {
      setPulseOpacity((prev) => (prev === 0 ? 1 : 0));
      time.delay(duration, toggleOpacity);
    };

    toggleOpacity();
    return time.dispose;
  }, [pulse.duration, pulse.pulsing]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg }),
    body: {
      base: css({
        position: 'relative',
        minWidth: 70,
        backgroundColor: Color.alpha(theme.fg, isOver ? 1 : 0.15),
        transition: `background-color 100ms ease-in-out`,
        Padding: [12, 25],
        borderRadius: 40,
        border: `solid 1px ${Color.alpha(theme.fg, 0.8)}`,
        display: 'grid',
      }),
      content: css({ display: 'grid', placeItems: 'center' }),
      pulse: css({
        Absolute: 0,
        Padding: [12, 25],
        borderRadius: 40,
        backgroundColor: Color.alpha(theme.fg, pulse.opacity),
        opacity: pulse ? pulseOpacity : 1,
        transition: `opacity ${pulse.duration}ms ease-in-out`,
      }),
    },
  };

  return (
    <Button theme={theme.name} onClick={props.onClick} onMouse={(e) => setOver(e.isOver)}>
      <div className={styles.body.base.class}>
        <div className={styles.body.pulse.class} />
        <div className={styles.body.content.class}>{label}</div>
      </div>
    </Button>
  );
};

/**
 * Helpers
 */
const wrangle = {
  pulse(input?: P['pulse']): Required<Pulse> {
    const DEFAULT: Required<Pulse> = { duration: 1500, pulsing: false, opacity: 0.2 };
    if (!input) return DEFAULT;
    if (input === true) return { ...DEFAULT, pulsing: true };
    return { ...DEFAULT, ...input };
  },
} as const;
