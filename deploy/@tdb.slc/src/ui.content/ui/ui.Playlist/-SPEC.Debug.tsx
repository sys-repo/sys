import React from 'react';
import { Programme } from '../../ui.Programme/v.ts';
import { type t, Button, css, ObjectView, Signal, D } from './common.ts';

type P = t.PlaylistProps;

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
    theme: s<P['theme']>('Light'),
    items: s<P['items']>(Programme.children[0].children),
    selected: s<P['selected']>(),
    filled: s<P['filled']>(),
    paddingTop: s<P['paddingTop']>(50),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.items.value;
      p.selected.value;
      p.filled.value;
      p.paddingTop.value;
    },
  };
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
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
      <div className={Styles.title.class}>{'Playlist'}</div>

      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />

      <hr />

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => {
          const items = p.items.value;
          return `items: ${items ? `array [${items.length}]` : `<undefined>`}`;
        }}
        onClick={() => {
          type T = t.VideoMediaContent[] | undefined;
          const m = Programme.children.map((m) => m.children).filter(Boolean);
          Signal.cycle<T>(p.items, [...m, undefined]);
        }}
      />
      <Button
        block
        label={() => `selected: ${p.selected.value ?? `<undefined>`}`}
        onClick={() => {
          const indexes = wrangle.asIndexes(p.items.value);
          Signal.cycle(p.selected, [...indexes, undefined]);
        }}
      />
      <Button
        block
        label={() => `filled: ${p.filled.value ?? `<undefined>`}`}
        onClick={() => {
          const indexes = wrangle.asIndexes(p.items.value);
          Signal.cycle(p.filled, [[0], [0, 1], indexes, undefined]);
        }}
      />

      <Button
        block
        label={() => `paddingTop: ${p.paddingTop.value ?? `<undefined> (defaut: ${D.paddingTop})`}`}
        onClick={() => Signal.cycle(p.paddingTop, [D.paddingTop, 50, 200, undefined])}
      />

      <hr />
      <ObjectView name={'props'} data={Signal.toObject(p)} expand={1} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  asIndexes<T>(arr: T[] = []): t.Index[] {
    return [...Array(arr.length).keys()];
  },
} as const;
