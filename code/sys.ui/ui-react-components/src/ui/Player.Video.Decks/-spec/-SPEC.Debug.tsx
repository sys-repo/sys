import React from 'react';
import {
  SAMPLE_BASEURLS,
  SAMPLE_PATHS,
  SampleVideoButtons,
} from '../../Player.Video.Element/-spec/mod.ts';
import { Button, ObjectView } from '../../u.ts';
import { Color, css, D, LocalStorage, Obj, Signal, type t, Url } from '../common.ts';
import { VideoDecks } from '../mod.ts';

type P = t.VideoDecksProps;
type Storage = Pick<P, 'debug' | 'theme' | 'aspectRatio' | 'muted' | 'active'> & {
  width?: t.Pixels;
  baseUrl?: t.StringUrl;
  urlPathA?: t.StringPath;
  urlPathB?: t.StringPath;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  active: D.active,
  aspectRatio: D.aspectRatio,
  muted: D.muted,
  //
  width: 320,
  baseUrl: SAMPLE_BASEURLS[0],
  urlPathA: SAMPLE_PATHS[0],
  urlPathB: SAMPLE_PATHS[2],
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
  const decks = VideoDecks.create();

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    active: s(snap.active),
    aspectRatio: s(snap.aspectRatio),
    muted: s(snap.muted),
    //
    width: s(snap.width),
    baseUrl: s(snap.baseUrl),
    urlPathA: s(snap.urlPathA),
    urlPathB: s(snap.urlPathB),
  };
  const p = props;
  const api = {
    props,
    decks,
    listen,
    reset,
    url(deck: t.VideoDecksProps['active'] = 'A') {
      const signal = deck === 'A' ? p.urlPathA : p.urlPathB;
      return Url.parse(p.baseUrl.value).join(signal.value ?? '');
    },
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
      d.urlPathA = p.urlPathA.value;
      d.urlPathB = p.urlPathB.value;
    });
  });

  /**
   *
   */
  Signal.effect(() => {
    const hrefA = api.url('A');
    const hrefB = api.url('B');

    decks.A.props.src.value = hrefA;
    decks.B.props.src.value = hrefB;
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
      <SampleVideoButtons baseUrl={p.baseUrl.value} signal={p.urlPathA} title={'Video: A'} />
      <SampleVideoButtons
        baseUrl={p.baseUrl.value}
        signal={p.urlPathB}
        title={'Video: B'}
        style={{ marginTop: 20 }}
      />

      <hr />
      <Button
        block
        label={() => `baseUrl: ${p.baseUrl.value}`}
        onClick={() => Signal.cycle(p.baseUrl, SAMPLE_BASEURLS)}
      />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView
        name={'decks'}
        data={Signal.toObject(debug.decks)}
        style={{ marginTop: 6 }}
        expand={1}
      />
    </div>
  );
};
