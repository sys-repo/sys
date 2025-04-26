import React from 'react';
import { type t, App, Button, css, D, ObjectView, Signal } from '../common.ts';
import { Programme } from '../mod.ts';

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
  const app = App.signals();
  const programme = Programme.signals();
  const content = Programme.factory(); // Factory → content definition 🌳.

  /**
   * Properties:
   */
  const props = {
    debug: s(false),
    theme: s<t.CommonTheme>('Dark'),
  };
  const p = props;
  const api = {
    app,
    programme,
    content,
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      app.listen();
      programme.listen();
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
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const c = debug.programme.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  const config = (index: number) => {
    const children = debug.content.media?.children ?? [];
    return (
      <Button
        block
        label={() => `Programme: ${children[index]?.title ?? '<undefined>'}`}
        onClick={() => {
          c.align.value = 'Right';
          c.media.value = children[index];
        }}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `align: ${c.align.value ?? `<undefined> (defaut: ${D.align})`}`}
        onClick={() => Signal.cycle(c.align, ['Center', 'Right'])}
      />

      <hr />
      <div className={Styles.title.class}>{'Sample Configurations:'}</div>

      {config(0)}
      {config(1)}
      {config(2)}
      {config(-1)}

      <hr />
      <ObjectView name={'debug'} data={Signal.toObject(debug)} expand={1} margin={[20, 0]} />
    </div>
  );
};
