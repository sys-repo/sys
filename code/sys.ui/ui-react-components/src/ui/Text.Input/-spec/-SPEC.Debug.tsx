import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Signal } from '../common.ts';

type P = t.TextInputProps;
type Storage = { theme?: t.CommonTheme; autoFocus?: boolean; disabled?: boolean; value?: string };

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
  const localstore = LocalStorage.immutable<Storage>(`dev:${D.name}`, {});

  const props = {
    debug: s(false),
    theme: s(localstore.current.theme),
    value: s<P['value']>(localstore.current.value),
    disabled: s<P['disabled']>(localstore.current.disabled),
    autoFocus: s<P['autoFocus']>(localstore.current.autoFocus),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.value.value;
      p.disabled.value;
      p.autoFocus.value;
    },
  };

  Signal.effect(() => {
    p.theme.value;
    localstore.change((d) => {
      d.theme = p.theme.value ?? 'Light';
      d.value = p.value.value;
      d.autoFocus = p.autoFocus.value ?? D.autoFocus;
      d.disabled = p.disabled.value ?? D.disabled;
    });
  });

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
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `disabled: ${p.disabled.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.disabled)}
      />
      <Button
        block
        label={() => `autoFocus: ${p.autoFocus.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.autoFocus)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={['$']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
