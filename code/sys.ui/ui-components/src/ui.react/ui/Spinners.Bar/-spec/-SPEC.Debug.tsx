import type React from 'react';
import { Spec } from '../../-test.ui.ts';
import { css, D, Dev, Obj, Signal, type t } from './common.ts';

type P = t.BarSpinner.Props;
const defaults: Pick<P, 'theme' | 'width' | 'transparentTrack'> = {
  theme: 'Light',
  width: undefined,
  transparentTrack: false,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;
  const props = {
    theme: s(defaults.theme),
    width: s(defaults.width),
    transparentTrack: s(defaults.transparentTrack),
  };
  const { attach } = Spec.attachments();

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(props, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  const api = { props, listen, reset, attach };
  init?.(api);
  return api;
}

const Styles = {
  title: css({ fontWeight: 'bold', marginBottom: 4 }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  return (
    <div className={css(props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <Dev.Button
        block
        label={() => `width: ${v.width ?? '(undefined)'}`}
        onClick={() => Signal.cycle<P['width']>(p.width, [undefined, 30, D.width, 300])}
      />

      <Dev.Button
        block
        label={() => `transparentTrack: ${v.transparentTrack}`}
        onClick={() => Signal.toggle(p.transparentTrack)}
      />

      <hr />
      <Dev.Button block label={() => '(reset)'} onClick={debug.reset} />
      <Dev.ObjectView name='props' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
