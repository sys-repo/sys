import React from 'react';
import { type t, App, Button, css, D, ObjectView, Signal } from '../common.ts';
import { Programme } from '../mod.ts';
import { programmeSectionButtons, Styles, videoPlayerButton } from './-SPEC.u.tsx';

export { programmeSectionButtons as configButtonSections, videoPlayerButton };

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
  const global = App.signals();

  const content = Programme.factory(); // Factory → content definition 🌳.
  const component = content.state;
  const state: t.ProgrammeState = { component };

  /**
   * Properties:
   */
  const props = {
    theme: s<t.CommonTheme>('Dark'),
  };
  const p = props;
  const api = {
    state,
    content,
    props,
    listen() {
      p.theme.value;
      global.listen();
      component.listen();
    },
    getMedia(index: t.Index) {
      const media = content.media;
      return media ? media.children?.[index] : undefined;
    },
  };
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const c = debug.state.component.props;

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
        label={() => `debug: ${c.debug.value}`}
        onClick={() => Signal.toggle(c.debug)}
      />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `align: ${c.align.value ?? `<undefined> (defaut: ${D.align})`}`}
        onClick={() => Signal.cycle(c.align, ['Center', 'Right'])}
      />

      <hr />
      {programmeSectionButtons(debug.content, debug.state.component)}

      <hr />
      {videoPlayerButton(debug.state.component)}

      <hr />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(debug)}
        expand={{ paths: ['$', '$.state', '$.state.component', '$.state.component.props'] }}
        margin={[20, 0]}
      />
    </div>
  );
};
