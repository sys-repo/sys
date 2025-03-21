import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, Signal } from './common.ts';

const local = new URL(`${location.origin}${location.pathname}`);

/**
 * Types:
 */
export type DebugProps = { ctx: { debug: DebugSignals }; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = DebugProps;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;
  const props = {
    showBackground: s<boolean>(true),

    theme: s<t.CommonTheme>('Light'),
    src: s<t.IFrameProps['src']>(local.href),
    allowFullScreen: s<t.IFrameProps['allowFullScreen']>(),
    loading: s<t.IFrameProps['loading']>(),
    sandbox: s<t.IFrameSandbox[] | undefined>(),
  };
  const api = { props };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<P> = (props) => {
  const { ctx } = props;
  const p = ctx.debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.src.value;
    p.showBackground.value;
    p.allowFullScreen.value;
    p.loading.value;
    p.sandbox.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({ color: theme.fg }),
    urlTitle: css({ fontWeight: 'bold' }),
  };

  const srcLoader = (label: string, src?: t.IFrameProps['src']) => {
    return <Button block label={label} onClick={() => (p.src.value = src)} />;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`show background image: ${p.showBackground}`}
        onClick={() => Signal.toggle(p.showBackground)}
      />

      <hr />

      <Button
        block
        label={`allowFullScreen: ${p.allowFullScreen}`}
        onClick={() => Signal.toggle(p.allowFullScreen)}
      />

      <Button
        block
        label={`loading: ${p.loading}`}
        onClick={() => {
          Signal.cycle<t.IFrameProps['loading']>(p.loading, ['eager', 'lazy', undefined]);
        }}
      />

      <Button
        block
        label={`sandbox: ${p.sandbox}`}
        onClick={() => {
          Signal.cycle<t.IFrameSandbox[] | undefined>(p.sandbox, [
            undefined,
            ['allow-popups', 'allow-same-origin'],
            ['allow-pointer-lock'],
          ]);
        }}
      />

      <hr />
      <div className={styles.urlTitle.class}>{`src: ${truncate(String(p.src.value))}`}</div>

      {srcLoader(local.host, local.href)}
      {srcLoader('Wikipedia: "W3C"', `https://en.wikipedia.org/wiki/World_Wide_Web_Consortium`)}
      {srcLoader('Wikipedia: "Foobar" mobile format', `https://en.m.wikipedia.org/wiki/Foobar`)}
      <hr />
      {srcLoader('error: google.com (← blocked)', 'https://google.com')}
      <hr />
      {srcLoader('{ html }', { html: '<h1>Hello 👋<h1>' })}
      {srcLoader('<undefined> ← unload', undefined)}
    </div>
  );
};

/**
 * Helpers
 */
const truncate = (s: string, max: number = 40): string => {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};
