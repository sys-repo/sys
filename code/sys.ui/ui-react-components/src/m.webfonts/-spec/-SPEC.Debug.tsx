import React from 'react';
import { type t, Button, Color, css, D, LocalStorage, Obj, Signal, STORAGE_KEY } from './common.ts';
import { FontStyle } from './-ui.FontStyle.tsx';

type FontName = t.Fonts.FontName;
type Storage = {
  theme?: t.CommonTheme;
  font?: FontName;
  sampleText?: string;
  weight?: t.FontWeight;
  italic?: boolean;
};
const defaults: Storage = {
  theme: 'Dark',
  font: 'ETBook',
  sampleText: 'The quick brown fox jumps over the lazy dog.',
  weight: 400,
  italic: false,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;

  const props = {
    theme: s(snap.theme),
    font: s(snap.font),
    sampleText: s(snap.sampleText),
    weight: s(snap.weight),
    italic: s(snap.italic),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.font = p.font.value;
      d.sampleText = p.sampleText.value;
      d.weight = p.weight.value;
      d.italic = p.italic.value;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 8,
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>
      <Button
        block
        label={() => `font: ${p.font.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<FontName>(p.font, ['ETBook', 'SourceSans3'])}
      />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <FontStyle debug={debug} />

      <hr />
      <Button block label={() => '(reset)'} onClick={debug.reset} />
    </div>
  );
};
