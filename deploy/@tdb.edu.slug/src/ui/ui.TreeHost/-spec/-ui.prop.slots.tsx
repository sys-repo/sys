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

  function slotButton(args: {
    label: string;
    current: () => t.TreeHostSlotInput | undefined;
    set: (value: t.TreeHostSlotInput | undefined) => void;
  }) {
    const { label, current, set } = args;
    return (
      <Button
        block
        label={() => `slot: ${label} ${current() ? '🐚' : ''}`}
        onClick={() => {
          const el = (
            <div style={{ padding: 8, fontSize: 12, opacity: 0.8 }}>{`slot:${label}`}</div>
          );
          set(current() ? undefined : el);
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
      {slotButton({
        label: 'nav.tree',
        current: () => p.slots.nav.tree.value,
        set: (value) => (p.slots.nav.tree.value = value),
      })}
      {slotButton({
        label: 'main.body',
        current: () => p.slots.main.body.value,
        set: (value) => (p.slots.main.body.value = value),
      })}
      {slotButton({
        label: 'nav.footer',
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
