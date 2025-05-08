import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, Signal } from '../common.ts';

type P = t.MediaVideoProps;

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
    borderRadius: s<P['borderRadius']>(),
    aspectRatio: s<P['aspectRatio']>(),
    fit: s<P['fit']>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.borderRadius.value;
      p.fit.value;
      p.aspectRatio.value;
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

      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => {
          const v = p.borderRadius.value;
          return `borderRadius: ${v ?? `<undefined> (default: ${D.borderRadius})`}`;
        }}
        onClick={() => Signal.cycle(p.borderRadius, [undefined, 5, 15])}
      />
      <Button
        block
        label={() => `fit: ${p.fit.value ?? `<undefined> (default: ${D.fit})`}`}
        onClick={() => Signal.cycle<P['fit']>(p.fit, ['cover', 'contain', undefined])}
      />

      <hr />
      {aspectRatioButtons(p)}

      <hr />
      <ObjectView name={'props'} data={Signal.toObject(debug.props)} expand={['$']} />
    </div>
  );
};

/**
 * Helpers
 */
export function aspectRatioButtons(props: {
  aspectRatio: t.Signal<number | undefined>;
  fit: t.Signal<P['fit'] | undefined>;
}) {
  const RATIOS = {
    'wide - 16:9': 16 / 9,
    'standard - 4:3': 4 / 3,
    'square - 1': 1,
    'portrait - 9:16': 9 / 16,
    'ultrawide - 21:9': 21 / 9,
  } as const;

  const btn = (label: string, value?: number) => {
    return (
      <Button
        key={label}
        block
        label={label}
        onClick={() => {
          props.aspectRatio.value = value;
          props.fit.value = undefined;
        }}
      />
    );
  };

  return (
    <React.Fragment>
      <div className={Styles.title.class}>{'Aspect Ratio:'}</div>
      {Object.entries(RATIOS).map(([name, value]) => btn(name, value))}
      {btn('<undefined>', undefined)}
    </React.Fragment>
  );
}
