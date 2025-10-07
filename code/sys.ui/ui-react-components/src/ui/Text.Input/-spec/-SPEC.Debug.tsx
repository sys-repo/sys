import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, Is, LocalStorage, Signal } from '../common.ts';

type P = t.TextInputProps;
type Storage = Pick<
  P,
  | 'theme'
  | 'debug'
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

  const defaults: Storage = {
    theme: 'Dark',
    debug: false,
    background: -0.05,
    border: { mode: 'underline' },
    borderRadius: 4,
    autoFocus: true,
    disabled: D.disabled,
    readOnly: D.readOnly,
    spellCheck: D.spellCheck,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    redraw: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
    background: s(snap.background),
    border: s(snap.border),
    borderRadius: s(snap.borderRadius),

    value: s(snap.value),
    placeholder: s(snap.placeholder),

    disabled: s(snap.disabled),
    readOnly: s(snap.readOnly),
    autoFocus: s(snap.autoFocus),
    spellCheck: s(snap.spellCheck),

    prefix: s<P['prefix']>(),
    suffix: s<P['suffix']>(),
  };

  const api = {
    get props() {
      return props;
    },
    localstore: store,
    listen() {
      Signal.listen(props);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      const p = props;
      d.theme = p.theme.value;
      d.value = p.value.value;
      d.placeholder = p.placeholder.value;
      d.autoFocus = p.autoFocus.value;
      d.disabled = p.disabled.value;
      d.readOnly = p.readOnly.value;
      d.background = p.background.value;
      d.border = p.border.value;
      d.borderRadius = p.borderRadius.value;
      d.spellCheck = p.spellCheck.value;
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
