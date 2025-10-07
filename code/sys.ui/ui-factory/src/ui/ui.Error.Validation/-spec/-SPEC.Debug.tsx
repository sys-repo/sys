import React from 'react';
import { type t, Button, css, D, Is, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { type ViewId, Sample } from './-samples.ts';

type Errs = readonly t.UseFactoryValidateError<ViewId>[];
type P = t.ValidationErrorsProps;

type Storage = Pick<P, 'theme' | 'debug' | 'title'> & { errors?: t.Json };
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  errors: Sample.errors1 as unknown as t.Json,
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

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    errors: s(snap.errors),
    title: s(snap.title),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen() {
      Signal.listen(props);
    },
    get errors() {
      return (p.errors.value ?? []) as unknown as Errs;
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.errors = p.errors.value;
      d.title = p.title.value;
    });
  });

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

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

  const errorsButn = (errors?: Errs, prefix: string = 'errors: ') => {
    return (
      <Button
        block
        label={() => {
          const v = errors;
          const out = !Is.array(v)
            ? '<undefined>'
            : v.length === 0
            ? '[ ] ← empty'
            : v.map((m) => m.id).join(', ');
          return `${prefix} ${out}`.trim();
        }}
        onClick={() => (p.errors.value = errors as unknown as t.Json)}
      />
    );
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
        label={() => `title: ${p.title.value ?? `<undefined>`}`}
        onClick={() =>
          Signal.cycle(p.title, [
            'Runtime Error',
            'Runtime Validation Error',
            'Foobar 👋',
            undefined,
          ])
        }
      />

      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      {Object.entries(Sample).map(([, value]) => errorsButn(value))}
      <hr />
      {errorsButn([])}
      {errorsButn(undefined)}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
