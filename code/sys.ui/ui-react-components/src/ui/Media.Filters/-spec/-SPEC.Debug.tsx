import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, Obj, Signal } from '../common.ts';
import { Filters } from '../mod.ts';

type P = t.MediaFiltersProps;

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
    values: s<P['values']>(Filters.values(Obj.keys(Filters.config))),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.values.value;
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
      <div className={Styles.title.class}>
        <div>{D.name}</div>
        <div>{'(List)'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      {filterValuesButtons(debug)}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={['$', '$.values']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

/**
 * Dev Buttons
 */

export function filterValuesButtons(debug: DebugSignals) {
  const p = debug.props;

  const btn = (filters: t.MediaFilterName[], label?: string) => {
    return (
      <Button
        block
        label={() => label ?? filters.join(', ')}
        onClick={() => (p.values.value = Filters.values(filters))}
      />
    );
  };

  return (
    <React.Fragment>
      <div className={Styles.title.class}>{'Values'}</div>

      <Button block label={`clear → <undefined>`} onClick={() => (p.values.value = undefined)} />
      {btn(Obj.keys(Filters.config), 'all')}
      {btn(['brightness', 'contrast', 'saturate'])}
      {btn(['saturate', 'contrast', 'brightness'])}
      {btn(['grayscale', 'contrast', 'brightness'])}
    </React.Fragment>
  );
}
