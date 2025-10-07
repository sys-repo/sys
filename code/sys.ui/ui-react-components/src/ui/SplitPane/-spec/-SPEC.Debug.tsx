import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Obj, Signal } from '../common.ts';

type P = t.SplitPaneProps;
type Storage = Pick<
  P,
  'theme' | 'debug' | 'enabled' | 'orientation' | 'defaultValue' | 'min' | 'max' | 'gutter' | 'only'
> & { isControlled?: boolean };
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  isControlled: true,
  //
  enabled: D.enabled,
  orientation: D.orientation,
  defaultValue: D.defaultValue,
  min: D.min,
  max: D.max,
  gutter: D.gutter,
  only: undefined,
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
    isControlled: s(snap.isControlled),

    enabled: s(snap.enabled),
    orientation: s(snap.orientation),
    defaultValue: s(snap.defaultValue),
    min: s(snap.min),
    max: s(snap.max),
    gutter: s(snap.gutter),
    only: s(snap.only),
  };
  const p = props;
  const api = {
    props,
    listen() {
      Signal.listen(props);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.isControlled = p.isControlled.value;
      //
      d.enabled = p.enabled.value;
      d.orientation = p.orientation.value;
      d.defaultValue = p.defaultValue.value;
      d.min = p.min.value;
      d.max = p.max.value;
      d.gutter = p.gutter.value;
      d.only = p.only.value;
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
        label={() => `enabled: ${p.enabled.value ?? `<undefined> (default: ${D.enabled})`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => {
          const v = p.orientation.value;
          return `orientation: ${v ?? `<undefined> (default: ${D.orientation})`}`;
        }}
        onClick={() => Signal.cycle(p.orientation, ['horizontal', 'vertical'])}
      />
      <Button
        block
        label={() => `only: ${p.only.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.only, ['A', 'B', undefined])}
      />
      <hr />
      <Button
        block
        label={() =>
          `defaultValue: ${p.defaultValue.value ?? `<undefined> (default: ${D.defaultValue})`}`
        }
        onClick={() => Signal.cycle(p.defaultValue, [0.3, D.defaultValue, 0.6, undefined])}
      />
      <Button
        block
        label={() => `min: ${p.min.value ?? `<undefined> (default: ${D.min})`}`}
        onClick={() => Signal.cycle(p.min, [0, D.min, 0.3, 0.5, undefined])}
      />
      <Button
        block
        label={() => `max: ${p.max.value ?? `<undefined> (default: ${D.max})`}`}
        onClick={() => Signal.cycle(p.max, [0.5, 0.8, D.max, 1, undefined])}
      />
      <Button
        block
        label={() => `gutter: ${p.gutter.value ?? `<undefined> (default: ${D.gutter})`}`}
        onClick={() => Signal.cycle(p.gutter, [0, 3, D.gutter, 10, undefined])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `controlled component: ${p.isControlled.value}`}
        onClick={() => Signal.toggle(p.isControlled)}
      />
      <Button
        block
        label={() => `(reset)`}
        onClick={() => Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)))}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
