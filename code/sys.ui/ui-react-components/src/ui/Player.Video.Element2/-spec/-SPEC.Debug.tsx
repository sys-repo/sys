import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Signal, Str } from '../common.ts';

type P = t.VideoElement2Props;
type Storage = Pick<P, 'theme' | 'debug'>;

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
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
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

      <hr />
      <div className={Styles.title.class}>{'Video:'}</div>
      {/* {videoButton(video, 'https://fs.socialleancanvas.com/video/540p/1068502644.mp4')}
      {videoButton(video, 'https://fs.socialleancanvas.com/video/540p/1068653222.mp4')} */}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
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

export function videoButton(video: t.VideoPlayerSignals, src: string) {
  const p = video.props;
  return (
    <Button
      block
      label={`src: ${Str.truncate(wrangle.srcLabel(src), 30)}`}
      onClick={() => (p.src.value = src)}
    />
  );
}
