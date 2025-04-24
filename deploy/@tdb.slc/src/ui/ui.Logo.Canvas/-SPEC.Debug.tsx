import React from 'react';
import { type t, Button, CanvasPanel, css, D, Signal } from './common.ts';
import { Selection } from './m.Selection.ts';

/**
 * Types
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssValue };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = t.LogoCanvasProps;

/**
 * Signals
 */
export function createDebugSignals() {
  const s = Signal.create;
  const props = {
    width: s<t.Pixels>(400),
    // Props:
    theme: s<P['theme']>('Dark'),
    over: s<P['over']>(),
    selected: s<P['selected']>('purpose'),
    selectionAnimation: s<P['selectionAnimation']>(),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.width.value;
      p.over.value;
      p.theme.value;
      p.selected.value;
      p.selectionAnimation.value;
    },
  };
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block={true}
        label={`width: ${p.width.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle(p.width, [undefined, 280, 400])}
      />

      <hr />
      <Button
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle(p.theme, ['Light', 'Dark'])}
      />

      {canvasSelectedButton(p.selected)}

      <Button
        block={true}
        label={() => {
          const value = Selection.animation(p.selectionAnimation.value);
          return `selectionAnimation.loop: ${value.loop ?? '<undefined>'}`;
        }}
        onClick={() => {
          const next = Selection.animation(p.selectionAnimation.value);
          next.loop = !(next.loop ?? D.selectionAnimation.loop);
          p.selectionAnimation.value = next;
        }}
      />
    </div>
  );
};

/**
 * Dev: selected panel(s) test button.
 */
export function canvasSelectedButton(signal: t.Signal<P['selected']>) {
  return (
    <Button
      block={true}
      label={() => {
        const value = signal.value;
        const fmt = Array.isArray(value) ? `array[${value.length}]` : value ?? '<undefined>';
        return `selected: ${fmt}`;
      }}
      onClick={() => Signal.cycle(signal, [undefined, CanvasPanel.list, 'purpose'])}
    />
  );
}
