import React from 'react';
import { type t, Button, css, D, ObjectView, Player, Signal } from '../common.ts';
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
  const player = Player.Video.signals({ fadeMask: 15, scale: (e) => e.enlargeBy(2) });

  /**
   * Properties:
   */
  const props = {
    theme: s<t.CommonTheme>('Dark'),
  };
  const api = {
    content,
    state,
    player,
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

      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `theme: ${debug.props.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(debug.props.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `align: ${p.align.value ?? `<undefined> (defaut: ${D.align})`}`}
        onClick={() => Signal.cycle(p.align, ['Center', 'Right'])}
      />

      <hr />
      {programmeSectionButtons(debug.content, debug.state)}

      <hr />
      {videoPlayerButton(debug.player)}

      <hr />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(debug)}
        expand={{ paths: ['$', '$.state', '$.state.component', '$.state.component.props'] }}
        margin={[20, 0]}
      />

      <ObjectView
        name={':state'}
        data={Signal.toObject(debug.state.props)}
        expand={{ paths: ['$', '$.section'] }}
        margin={[20, 0]}
      />
    </div>
  );
};
