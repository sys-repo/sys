import React from 'react';
import { Foo } from './-ui.Foo.tsx';
import { type t, Button, Color, css, Signal } from './common.ts';

export type PropSlotsProps = {
  debug: t.DebugSignals;
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

  function slotFoo(slot: t.TreeHostSlot) {
    return (
      <Foo
        theme={p.theme.value}
        label={`slot:${slot}`}
        padding={slot === 'aux' ? [0, 4, 4, 4] : 4}
      />
    );
  }

  type SlotSignalKey = keyof typeof p.slots;
  function slotButton(slot: SlotSignalKey) {
    const current = () => p.slots[slot].value;
    return (
      <Button
        block
        label={() => `slot: ${slot} ${current() ? '🐚' : ''}`}
        onClick={() => {
          const el = slotFoo(slot);
          p.slots[slot].value = current() ? undefined : el;
        }}
      />
    );
  }

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
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
