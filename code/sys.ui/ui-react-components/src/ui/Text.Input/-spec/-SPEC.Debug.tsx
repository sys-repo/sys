import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, Is, LocalStorage, Signal } from '../common.ts';

type P = t.TextInputProps;
type Storage = Pick<
  P,
  | 'theme'
  | 'autoFocus'
  | 'disabled'
  | 'value'
  | 'placeholder'
  | 'background'
  | 'border'
  | 'borderRadius'
  | 'spellCheck'
>;

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
    background: s<P['background']>(localstore.current.background),
    border: s<P['border']>(localstore.current.border),
    borderRadius: s<P['borderRadius']>(localstore.current.borderRadius),

    value: s<P['value']>(localstore.current.value),
    placeholder: s<P['placeholder']>(localstore.current.placeholder),

    disabled: s<P['disabled']>(localstore.current.disabled),
    autoFocus: s<P['autoFocus']>(localstore.current.autoFocus),
    spellCheck: s<P['spellCheck']>(localstore.current.spellCheck),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.value.value;
      p.placeholder.value;
      p.disabled.value;
      p.autoFocus.value;
      p.background.value;
      p.border.value;
      p.borderRadius.value;
      p.spellCheck.value;
    },
  };

  Signal.effect(() => {
    localstore.change((d) => {
      d.theme = p.theme.value ?? 'Light';
      d.value = p.value.value;
      d.placeholder = p.placeholder.value;
      d.autoFocus = p.autoFocus.value ?? true;
      d.disabled = p.disabled.value ?? D.disabled;
      d.background = p.background.value ?? D.background;
      d.border = p.border.value ?? D.border;
      d.borderRadius = p.borderRadius.value ?? 4;

      d.spellCheck = p.spellCheck.value ?? D.spellCheck;
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
        label={() => `placeholder: ${p.placeholder.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.placeholder, ['my placeholder', undefined])}
      />

      <Button
        block
        label={() => {
          const v = p.background.value;
          return `background: ${v ?? `<undefined> (default: ${D.background})`}`;
        }}
        onClick={() => {
          Signal.cycle(p.background, [undefined, 0, -0.05, Color.ruby(0.08)]);
        }}
      />
      <Button
        block
        label={() => {
          const v = p.border.value;
          const print = Is.record(v)
            ? v.mode
              ? `{ mode: '${v.mode}', ... }`
              : `{ focusColor: '${v.focusColor}' }`
            : v;
          return `border: ${print ?? `<undefined>`}`;
        }}
        onClick={() =>
          Signal.cycle(p.border, [
            true,
            false,
            D.border,
            { mode: 'none' },
            { mode: 'underline' },
            { focusColor: 'red', defaultColor: Color.ruby(0.15) },
            undefined,
          ])
        }
      />
      <Button
        block
        label={() => {
          const v = p.borderRadius.value;
          return `borderRadius: ${v ?? `<undefined> (default: ${D.borderRadius})`}`;
        }}
        onClick={() => Signal.cycle(p.borderRadius, [4, 8, undefined])}
      />

      <hr />
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

      <Button
        block
        label={() => {
          return `spellCheck: ${p.spellCheck.value ?? `<undefined> (default: ${D.spellCheck})`}`;
        }}
        onClick={() => Signal.toggle(p.spellCheck)}
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
        style={{ marginTop: 10 }}
        expand={['$']}
      />
    </div>
  );
};
