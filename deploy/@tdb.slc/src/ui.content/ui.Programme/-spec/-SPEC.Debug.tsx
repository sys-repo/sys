import React from 'react';
import { type t, App, Button, css, D, ObjectView, Signal } from '../common.ts';
import { Programme } from '../mod.ts';

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
  const state: t.ProgrammeState = { global, component };

  /**
   * Properties:
   */
  const props = {
    debug: s(false),
    theme: s<t.CommonTheme>('Dark'),
  };
  const p = props;
  const api = {
    content,
    state,
    props,
    listen() {
      p.debug.value;
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
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
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
      {configButtonSections(debug.content, debug.state.component)}

      <hr />
      <ObjectView name={'debug'} data={Signal.toObject(debug)} expand={1} margin={[20, 0]} />
    </div>
  );
};

/**
 * Dev Helpers
 */
export function configButtonSections(
  content: t.VideoContent,
  programme: t.ProgrammeSignals,
  options: { title?: string } = {},
) {
  const title = options.title ?? 'Programme Sections:';

  const config = (index: number) => {
    const children = content.media?.children ?? [];
    return (
      <Button
        block
        label={() => `Programme: ${children[index]?.title ?? '<undefined>'}`}
        onClick={() => {
          programme.props.align.value = 'Right';
          programme.props.section.value = { index };
        }}
      />
    );
  };

  return (
    <React.Fragment key={'dev-programme-sections'}>
      <div className={Styles.title.class}>{title}</div>
      {config(0)}
      {config(1)}
      {config(2)}
      {config(-1)}
    </React.Fragment>
  );
}
