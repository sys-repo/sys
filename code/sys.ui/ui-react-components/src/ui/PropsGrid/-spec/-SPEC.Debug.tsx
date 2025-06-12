import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Signal } from '../common.ts';

type P = t.PropsGridProps;
type Storage = { width?: number; theme?: t.CommonTheme };

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
    width: s(localstore.current.width),
    data: s<P['data']>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.width.value;
      p.data.value;
    },
  };

  Signal.effect(() => {
    p.theme.value;
    p.width.value;
    localstore.change((d) => {
      d.theme = p.theme.value ?? 'Light';
      d.width = p.width.value ?? 330;
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

      <hr />
      {sampleButtons({ debug })}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `width: ${p.width.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.width, [220, 330, 420, 550, undefined])}
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
 * Dev Tools:
 */
export function sampleButtons(args: { debug: DebugSignals }) {
  const p = args.debug.props;
  const elements: JSX.Element[] = [];

  const btn = (label: string, data?: t.PropsGridRows) => {
    const btn = (
      <Button
        key={elements.length}
        block
        label={() => `sample: ${label}`}
        onClick={() => (p.data.value = data)}
      />
    );

    elements.push(btn);
  };

  btn('<undefined>', undefined);
  btn('simple', [[{ value: 123 }]]);

  return <React.Fragment>{elements}</React.Fragment>;
}
