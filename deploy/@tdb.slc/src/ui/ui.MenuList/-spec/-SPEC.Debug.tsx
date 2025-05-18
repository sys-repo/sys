import React from 'react';
import { type t, Button, css, D, ObjectView, Signal } from '../common.ts';
import { Sample } from './-SPEC.sample.tsx';

type P = t.MenuListProps;

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

  const props = {
    debug: s(false),
    debugStateful: s(true),
    debugMultiselect: s(true),
    theme: s<P['theme']>('Light'),
    items: s<P['items']>(Sample.items),
    selected: s<P['selected']>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.debugStateful.value;
      p.debugMultiselect.value;
      p.theme.value;
      p.items.value;
      p.selected.value;
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
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `debug:stateful: ${p.debugStateful.value}`}
        onClick={() => {
          Signal.toggle(p.debugStateful);
          const isStateful = p.debugStateful.value;
          if (!isStateful) {
            p.selected.value = undefined;
            p.debugMultiselect.value = false;
          }
        }}
      />
      <Button
        block
        label={() => `debug:multi-select: ${p.debugMultiselect.value}`}
        onClick={() => {
          Signal.toggle(p.debugMultiselect);
          const isMultiselect = p.debugMultiselect.value;
          if (isMultiselect) p.debugStateful.value = true;
        }}
      />

      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `selected: ${p.selected.value ?? `<undefined> (default: ${D.selected})`}`}
        onClick={() => Signal.cycle(p.selected, [D.selected, 0, [1, 2], undefined])}
      />

      <hr />
      <Button
        block
        label={() => {
          const items = p.items.value;
          return `items: ${items ? `array [${items.length}]` : `<undefined>`}`;
        }}
        onClick={() => {
          type T = P['items'];
          const items = Sample.items;
          Signal.cycle<T>(p.items, [items, items.toReversed(), undefined]);
        }}
      />

      <hr />
      <ObjectView name={'props'} data={Signal.toObject(p)} expand={1} />
    </div>
  );
};
