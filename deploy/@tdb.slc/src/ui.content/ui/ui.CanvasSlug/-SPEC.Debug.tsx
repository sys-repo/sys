import React from 'react';
import { canvasSelectedButton } from '../../../ui/ui.Logo.Canvas/-SPEC.Debug.tsx';
import { css, D, Dev, Signal, type t } from './-spec/common.ts';

type P = t.CanvasSlugProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;
  const props = {
    debug: s<P['debug']>(true),
    theme: s<P['theme']>('Light'),
    selected: s<P['selected']>(),
    logo: s<P['logo']>(D.logo),
    text: s<P['text']>(),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.debug.value;
      p.theme.value;
      p.selected.value;
      p.logo.value;
      p.text.value;
    },
  };
  init?.(api);
  return api;
}

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
    title: css({
      fontWeight: 'bold',
      marginBottom: 10,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'CanvasSlug'}</div>

      <Dev.Button block label={() => `debug: ${p.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button
        block
        label={() => `theme: ${p.theme}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Dev.Button
        block
        label={() => `logo: "${p.logo}"`}
        onClick={() => Signal.cycle<P['logo']>(p.logo, [undefined, 'SLC', 'CC'])}
      />
      <Dev.Button
        block
        label={() => `text: ${p.text.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<P['text']>(p.text, [undefined, 'hello', 'purpose\nimpact']);
        }}
      />
      {canvasSelectedButton(p.selected)}

      <hr />
    </div>
  );
};
