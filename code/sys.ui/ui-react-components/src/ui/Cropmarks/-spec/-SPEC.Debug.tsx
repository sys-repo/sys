import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Signal, Style } from '../common.ts';

type P = t.CropmarksProps;
type Storage = Pick<P, 'theme' | 'debug' | 'size' | 'subjectOnly'>;
const defaults: Storage = {
  theme: 'Dark',
  debug: true,
  subjectOnly: false,
  size: undefined,
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
    subjectOnly: s(snap.subjectOnly),
    size: s(snap.size),
  };
  const p = props;
  const api = {
    props,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.size = p.size.value;
      d.subjectOnly = p.subjectOnly.value;
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

  const setSize = (label: string, size?: t.CropmarksSize) => {
    return (
      <Button
        block
        label={`size: ${label}`}
        onClick={() => {
          p.size.value = size;
        }}
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
        label={`subjectOnly: ${p.subjectOnly}`}
        onClick={() => Signal.toggle(p.subjectOnly)}
      />

      <hr />
      {setSize('<undefined>', undefined)}
      {setSize('center', { mode: 'center' })}
      {setSize('fill', { mode: 'fill', x: true, y: true, margin: [40, 40, 40, 40] })}

      {!!p.size.value?.mode && <hr />}
      {p.size.value?.mode === 'center' && <DebugCenter debug={debug} />}
      {p.size.value?.mode === 'fill' && <DebugFill debug={debug} />}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};

/**
 * Component:
 */
export type DebugFillProps = { debug: DebugSignals; style?: t.CssInput };
export const DebugFill: React.FC<DebugFillProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const size = p.size.value;
  if (size?.mode !== 'fill') return null;

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  const cycleBool = (current?: boolean) => {
    if (current === undefined) return true;
    if (current === true) return false;
    return undefined;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`size.margin: ${size.margin ?? '<undefined>'}`}
        onClick={() => {
          const margin = Style.Edges.toArray(size.margin);
          const current = margin[0];
          let next: number | number[] = [40, 40, 40, 40];
          if (current === 40) next = [80, 60, 30, 10];
          if (current === 80) next = 100;
          if (current === 100) next = [40];
          if (current === 40) next = [0, 40];
          if (current === 0) next = [40, 0];
          p.size.value = { ...size, margin: next as t.CssMarginArray };
        }}
      />

      <Button
        block
        label={`size.x: ${size.x ?? '<undefined>'}`}
        onClick={() => (p.size.value = { ...size, x: cycleBool(size.x) })}
      />

      <Button
        block
        label={`size.y: ${size.y ?? '<undefined>'}`}
        onClick={() => (p.size.value = { ...size, y: cycleBool(size.y) })}
      />
    </div>
  );
};

/**
 * Component:
 */
export type DebugCenterProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};
export const DebugCenter: React.FC<DebugCenterProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  const size = p.size.value;
  if (size?.mode !== 'center') return null;

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  const sizes = [0, 300, 500];

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`size.width: ${size.width}`}
        onClick={() => {
          const next = cycleNumber(size.width ?? 0, sizes);
          p.size.value = { ...size, width: next };
        }}
      />

      <Button
        block
        label={`size.height: ${size.height}`}
        onClick={() => {
          const next = cycleNumber(size.height ?? 0, sizes);
          p.size.value = { ...size, height: next };
        }}
      />
    </div>
  );
};

/**
 * Helpers:
 */
function cycleNumber(current: number, values: number[]): number {
  const index = values.indexOf(current);
  const nextIndex = index >= 0 ? (index + 1) % values.length : 0;
  return values[nextIndex];
}
