import React from 'react';
import { type t, Button, Color, css, Signal } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type PropSlotsProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const PropSlots: React.FC<PropSlotsProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  type SlotSignalKey = keyof typeof p.slots;
  function slotButton(slot: SlotSignalKey) {
    const current = () => p.slots[slot].value;
    return (
      <Button
        block
        label={() => `slot: ${slot} ${current() ? '🐚' : ''}`}
        onClick={() => {
          const el = (
            <div style={{ padding: 8, fontSize: 12, opacity: 0.8 }}>{`slot:${slot}`}</div>
          );
          p.slots[slot].value = current() ? undefined : el;
        }}
      />
    );
  }

  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {slotButton('tree')}
      {slotButton('main')}
      {slotButton('aux')}
      <Button
        block
        label={() => `(clear)`}
        onClick={() => Signal.walk(p.slots, (e) => e.mutate(undefined))}
      />
    </div>
  );
};
