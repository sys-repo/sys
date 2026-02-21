import React from 'react';
import { Foo } from './-ui.foobar.tsx';
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

  function slotFoo(slot: t.TreeHost.Slot) {
    return (
      <Foo
        theme={p.theme.value}
        label={`slot:${slot}`}
        padding={slot === 'nav:footer' ? [0, 4, 4, 4] : 4}
      />
    );
  }

  function slotButton(args: {
    label: string;
    slot: t.TreeHost.Slot;
    current: () => t.TreeHost.SlotInput | undefined;
    set: (value: t.TreeHost.SlotInput | undefined) => void;
  }) {
    const { label, slot, current, set } = args;
    return (
      <Button
        block
        label={() => `slot: ${label} ${current() ? '🐚' : ''}`}
        onClick={() => {
          const el = slotFoo(slot);
          set(current() ? undefined : el);
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
      {slotButton({
        label: 'nav.tree',
        slot: 'nav:tree',
        current: () => p.slots.nav.tree.value,
        set: (value) => (p.slots.nav.tree.value = value),
      })}
      {slotButton({
        label: 'main.body',
        slot: 'main:body',
        current: () => p.slots.main.body.value,
        set: (value) => (p.slots.main.body.value = value),
      })}
      {slotButton({
        label: 'nav.footer',
        slot: 'nav:footer',
        current: () => p.slots.nav.footer.value,
        set: (value) => (p.slots.nav.footer.value = value),
      })}
      <Button
        block
        label={() => `(clear)`}
        onClick={() => Signal.walk(p.slots, (e) => e.mutate(undefined))}
      />
    </div>
  );
};
