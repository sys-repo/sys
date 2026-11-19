import React from 'react';
import { css, D, Dev, Player, Signal, type t } from './common.ts';
import { Programme } from '../mod.ts';
import { programmeSectionButtons, Styles, videoPlayerButton } from './-SPEC.u.tsx';

export { programmeSectionButtons, videoPlayerButton };

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
  const content = Programme.factory();
  const state = Programme.Signals.init({ content });
  const video = Player.Video.Signals.create({ fadeMask: 15, scale: (e) => e.enlargeBy(2) });

  /**
   * Properties:
   */
  const props = {
    theme: s<t.CommonTheme>('Dark'),
  };
  const api = {
    content,
    state,
    video,
    props,
    listen() {
      props.theme.value;
      state.listen();
    },
  };

  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.state.props;

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

      <Dev.Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Dev.Button
        block
        label={() => `theme: ${debug.props.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(debug.props.theme, ['Light', 'Dark'])}
      />
      <Dev.Button
        block
        label={() => `align: ${p.align.value ?? `<undefined> (default: ${D.align})`}`}
        onClick={() => Signal.cycle(p.align, ['Center', 'Right'])}
      />

      <hr />
      {programmeSectionButtons(debug.content, debug.state)}

      <hr />
      {videoPlayerButton(debug.video)}

      <hr />
      <Dev.ObjectView name={'debug'} data={Signal.toObject(debug)} expand={0} margin={[5, 0]} />
      <Dev.ObjectView
        name={'state'}
        data={Signal.toObject(debug.state.props)}
        expand={{ paths: ['$', '$.section'] }}
        margin={[5, 0]}
      />
    </div>
  );
};
