import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, LocalStorage, Obj, Signal } from '../common.ts';
import {
  SampleVideoButtons,
  SAMPLE_PATHS,
  SAMPLE_BASEURLS,
} from '../../Player.Video.Element/-spec/mod.ts';

type P = t.VideoDecksProps;
type Storage = Pick<P, 'debug' | 'theme' | 'aspectRatio' | 'muted' | 'active'> & {
  width?: t.Pixels;
  baseUrl?: t.StringUrl;
  urlPath?: t.StringPath;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  active: D.active,
  aspectRatio: D.aspectRatio,
  muted: D.muted,
  //
  width: 320,
  baseUrl: 'https://fs.socialleancanvas.com',
  urlPath: SAMPLE_PATHS[0],
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    active: s(snap.active),
    aspectRatio: s(snap.aspectRatio),
    muted: s(snap.muted),
    //
    width: s(snap.width),
    baseUrl: s(snap.baseUrl),
    urlPath: s(snap.urlPath),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.active = p.active.value;
      d.aspectRatio = p.aspectRatio.value;
      d.muted = p.muted.value;
      //
      d.width = p.width.value;
      d.baseUrl = p.baseUrl.value;
      d.urlPath = p.urlPath.value;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
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
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    vcenter: css({ display: 'flex', alignItems: 'center', gap: 6 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => `active: ${p.active.value ?? `(undefined) ← default: ${D.active}`}`}
        onClick={() => Signal.cycle(p.active, ['A', 'B', undefined])}
      />

      <Button
        block
        label={() => {
          const v = p.aspectRatio.value;
          return `aspectRatio: ${v ?? `(undefined) ← default: ${D.aspectRatio}`}`;
        }}
        onClick={() => Signal.cycle(p.aspectRatio, [D.aspectRatio, '4/3', undefined])}
      />

      <Button
        block
        label={() => `muted: ${p.muted.value ?? `(undefined) ← default: ${D.muted}`}`}
        onClick={() => Signal.toggle(p.muted)}
      />

      <hr />
      <div className={Styles.title.class}>{'Video:'}</div>
      <SampleVideoButtons baseUrl={p.baseUrl.value} signal={p.urlPath} />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button
        block
        label={() => `baseUrl: ${p.baseUrl.value}`}
        onClick={() => Signal.cycle(p.baseUrl, SAMPLE_BASEURLS)}
      />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
