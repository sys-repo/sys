import React from 'react';
import { Programme } from '../../ui.content/ui.Programme/v.ts';
import { type t, Button, css, D, Is, ObjectView, Signal } from './common.ts';

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
    items: s<P['items']>(Programme.children[1].children?.map((m) => m.title)),
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
        label={() => `debug:multiselect: ${p.debugMultiselect.value}`}
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
          type T = P['items'] | undefined;
          const m = Programme.children
            .map((m) => m.children?.map((m) => m.title))
            .filter((m) => !Is.nil(m));
          Signal.cycle<T>(p.items, [...m, undefined]);
        }}
      />

      <hr />
      <ObjectView name={'props'} data={Signal.toObject(p)} expand={1} />
    </div>
  );
};
