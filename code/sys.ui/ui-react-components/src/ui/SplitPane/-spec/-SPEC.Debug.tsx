import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, Is, LocalStorage, Num, Obj, Signal } from '../common.ts';
import { even, fromScalar, toScalar } from './-u.ts';

type P = t.SplitPaneProps;
type Base = Pick<
  P,
  | 'theme'
  | 'debug'
  | 'enabled'
  | 'orientation'
  | 'defaultValue'
  | 'min'
  | 'max'
  | 'gutter'
  | 'onlyIndex'
>;
type Storage = Base & { isControlled?: boolean; childCount?: number; controlledRatios?: number[] };
const defaults: Storage = {
  theme: 'Light',
  debug: false,
  isControlled: true,
  childCount: 2,
  controlledRatios: even(2),

  defaultValue: fromScalar(2, D.defaultValue),
  enabled: D.enabled,
  orientation: D.orientation,
  min: D.min,
  max: D.max,
  gutter: D.gutter,
  onlyIndex: undefined,
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
    childCount: s(snap.childCount),
    controlledRatios: s(snap.controlledRatios),

    enabled: s(snap.enabled),
    orientation: s(snap.orientation),
    defaultValue: s(snap.defaultValue),
    min: s(snap.min),
    max: s(snap.max),
    gutter: s(snap.gutter),
    onlyIndex: s(snap.onlyIndex),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props);
  }
  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.isControlled = p.isControlled.value;
      d.childCount = p.childCount.value;
      d.controlledRatios = p.controlledRatios.value;
      //
      d.enabled = p.enabled.value;
      d.orientation = p.orientation.value;
      d.defaultValue = p.defaultValue.value;
      d.min = p.min.value;
      d.max = p.max.value;
      d.gutter = p.gutter.value;
      d.onlyIndex = p.onlyIndex.value;
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
  const theme = Color.theme();
  const styles = { base: css({ color: theme.fg }) };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `enabled: ${p.enabled.value ?? `(undefined) ← default: ${D.enabled}`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => {
          const v = p.orientation.value;
          return `orientation: ${v ?? `(undefined) ← default: ${D.orientation}`}`;
        }}
        onClick={() => Signal.cycle(p.orientation, ['horizontal', 'vertical'])}
      />
      <Button
        block
        label={() => {
          const i = p.onlyIndex.value;
          return `only: ${i != null ? Num.toLetter(i) : '(undefined)'}`;
        }}
        onClick={() => {
          const curr = p.onlyIndex.value;
          const seq: (number | undefined)[] = [0, 1, undefined];
          const idx = seq.findIndex((v) => v === curr);
          const next = seq[(idx + 1 + seq.length) % seq.length];
          p.onlyIndex.value = next;
        }}
      />
      <hr />
      <Button
        block
        label={() => {
          const n = p.childCount.value ?? 2;
          const dv = p.defaultValue.value;
          const calcLeft = () => {
            const left = toScalar(dv);
            const defLeft = toScalar(fromScalar(n, D.defaultValue));
            return left != null ? String(left) : `(undefined) ← default: ${defLeft}`;
          };
          const text = n === 2 ? calcLeft() : `(len=${Array.isArray(dv) ? dv.length : 0})`;
          return `defaultValue: ${text}`;
        }}
        onClick={() => {
          const defaultValue = p.defaultValue.value;
          const childCount = p.childCount.value;
          if (childCount === 2) {
            const seq = [0.3, D.defaultValue, 0.6, undefined] as const;
            const scalar = toScalar(defaultValue);
            const idx = seq.findIndex((n) => n === scalar);
            const next = seq[(idx + 1 + seq.length) % seq.length];
            p.defaultValue.value = Is.num(next) ? fromScalar(2, next) : undefined;
          } else {
            // For N panes, toggle undefined ↔ even split:
            const isDefined = Array.isArray(defaultValue) && defaultValue.length === childCount;
            p.defaultValue.value = isDefined ? undefined : even(childCount);
          }
        }}
      />
      <Button
        block
        label={() => `min: ${p.min.value ?? `(undefined) ← default: ${D.min}`}`}
        onClick={() => Signal.cycle(p.min, [0, D.min, 0.3, 0.5, undefined])}
      />
      <Button
        block
        label={() => `max: ${p.max.value ?? `(undefined) ← default: ${D.max}`}`}
        onClick={() => Signal.cycle(p.max, [0.5, 0.8, D.max, 1, undefined])}
      />
      <Button
        block
        label={() => `gutter: ${p.gutter.value ?? `(undefined) ← default: ${D.gutter}`}`}
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
        label={() => {
          const v = p.isControlled.value;
          return `controlled: ${v} ← ${v ? '(signal state)' : '(internal state)'}`;
        }}
        onClick={() => Signal.toggle(p.isControlled)}
      />
      <Button
        block
        label={() => `childCount: ${p.childCount.value}`}
        onClick={() => Signal.cycle(p.childCount, [0, 1, 2, 3, 4, undefined])}
      />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
