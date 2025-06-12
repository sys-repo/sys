import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, Is, LocalStorage, Signal } from '../common.ts';
import { readonly } from 'zod/v4-mini';

type P = t.TextInputProps;
type Storage = Pick<
  P,
  | 'theme'
  | 'autoFocus'
  | 'disabled'
  | 'readOnly'
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
    readOnly: s<P['readOnly']>(localstore.current.readOnly),
    autoFocus: s<P['autoFocus']>(localstore.current.autoFocus),
    spellCheck: s<P['spellCheck']>(localstore.current.spellCheck),

    prefix: s<P['prefix']>(),
    suffix: s<P['suffix']>(),
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
      p.readOnly.value;
      p.autoFocus.value;
      p.background.value;
      p.border.value;
      p.borderRadius.value;
      p.spellCheck.value;
      p.prefix.value;
      p.suffix.value;
    },
  };

  Signal.effect(() => {
    localstore.change((d) => {
      d.theme = p.theme.value ?? 'Light';
      d.value = p.value.value;
      d.placeholder = p.placeholder.value;
      d.autoFocus = p.autoFocus.value ?? true;
      d.disabled = p.disabled.value ?? D.disabled;
      d.readOnly = p.readOnly.value ?? D.readOnly;
      d.background = p.background.value ?? -0.05;
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
        label={() => `readOnly: ${p.readOnly.value ?? `<undefined> (default: ${D.readOnly})`}`}
        onClick={() => Signal.toggle(p.readOnly)}
      />
      <Button
        block
        label={() => `autoFocus: ${p.autoFocus.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.autoFocus)}
      />
      <Button
        block
        label={() => `autoFocus: (increment number)`}
        onClick={() => {
          if (Is.bool(p.autoFocus.value)) p.autoFocus.value = -1;
          (p.autoFocus.value as number) += 1;
        }}
      />

      <Button
        block
        label={() => {
          const v = p.spellCheck.value;
          return `spellCheck: ${v ?? `<undefined> (default: ${D.spellCheck})`}`;
        }}
        onClick={() => Signal.toggle(p.spellCheck)}
      />

      <hr />
      <div className={Styles.title.class}>{'Suffix / Prefix'}</div>
      {prefixSuffixButtons(debug)}

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

/**
 * Dev Helpers:
 */
export function prefixSuffixButtons(debug: DebugSignals) {
  const p = debug.props;
  const render = (children: t.ReactNode) => {
    const style = css({
      backgroundColor: Color.RUBY,
      PaddingX: 20,
      display: 'grid',
      placeItems: 'center',
    });
    return <div className={style.class}>{children}</div>;
  };
  return (
    <React.Fragment>
      <Button
        block
        label={() => `prefix: <element>`}
        onClick={() => (p.prefix.value = render('🐷'))}
      />
      <Button
        block
        label={() => `suffix: <element>`}
        onClick={() => (p.suffix.value = render('🌳'))}
      />
      <Button
        block
        label={() => `(clear)`}
        onClick={() => {
          p.prefix.value = undefined;
          p.suffix.value = undefined;
        }}
      />
    </React.Fragment>
  );
}
