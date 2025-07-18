import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Signal, Str } from '../common.ts';

type P = t.VideoElement2Props;
type Storage = Pick<
  P,
  'theme' | 'debug' | 'muted' | 'autoPlay' | 'src' | 'borderRadius' | 'loop' | 'aspectRatio'
> & { width?: number };

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

  const defaults: Storage = {
    theme: 'Dark',
    debug: true,
    width: 420,
    muted: false,
    autoPlay: false,
    loop: false,
    aspectRatio: '16/9',
    borderRadius: 6,
    src: 'https://fs.socialleancanvas.com/video/540p/1068502644.mp4',
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    width: s(snap.width),

    src: s(snap.src),
    muted: s(snap.muted),
    loop: s(snap.loop),
    autoPlay: s(snap.autoPlay),
    borderRadius: s(snap.borderRadius),
    aspectRatio: s(snap.aspectRatio),
  };
  const p = props;
  const api = {
    props,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.width = p.width.value;

      d.src = p.src.value;
      d.autoPlay = p.autoPlay.value;
      d.muted = p.muted.value;

      d.loop = p.loop.value;
      d.muted = p.muted.value;
      d.muted = p.muted.value;
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

      <Button
        block
        label={() => `muted: ${p.muted.value}`}
        onClick={() => Signal.toggle(p.muted)}
      />
      <Button
        block
        label={() => `autoPlay: ${p.autoPlay.value}`}
        onClick={() => Signal.toggle(p.autoPlay)}
      />
      <Button block label={() => `loop: ${p.loop.value}`} onClick={() => Signal.toggle(p.loop)} />
      <Button
        block
        label={() => `borderRadius: ${p.borderRadius.value}`}
        onClick={() => Signal.cycle(p.borderRadius, [0, 6, 15])}
      />

      <hr />
      <div className={Styles.title.class}>{'Video:'}</div>
      {videoButton(p.src, 'https://fs.socialleancanvas.com/video/540p/1068502644.mp4')}
      {videoButton(p.src, 'https://fs.socialleancanvas.com/video/540p/1068653222.mp4')}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />

      <Button
        block
        label={() => `width: ${p.width.value}`}
        onClick={() => Signal.cycle(p.width, [320, 420, 420])}
      />

      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  srcLabel(input: string) {
    if (!input.startsWith('https:')) return input;

    // Shorten URL:
    const path = new URL(input).pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return `https: → ${filename}`;
  },
} as const;

export function videoButton(signal: t.Signal<string | undefined>, src: string) {
  return (
    <Button
      block
      label={`src: ${Str.truncate(wrangle.srcLabel(src), 30)}`}
      onClick={() => (signal.value = src)}
    />
  );
}
