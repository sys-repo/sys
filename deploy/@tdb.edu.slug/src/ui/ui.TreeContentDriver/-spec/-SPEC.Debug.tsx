import React from 'react';
import { DataCards } from '../../-dev/ui.Http.DataCards/mod.ts';
import { createOrchestrator } from './-u.orchestrator.ts';
import {
  type t,
  Button,
  Color,
  css,
  D,
  Dev,
  Is,
  LocalStorage,
  ObjectView,
  Signal,
} from './common.ts';

type Storage = {
  debug?: boolean;
  theme?: t.CommonTheme;
  env?: t.HttpOriginEnv;
  cardKind?: t.DataCardKind;
};
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  env: Is.localhost() ? 'localhost' : 'production',
  cardKind: 'file-content',
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
  const card = DataCards.createSignals({ totalVisible: 5 });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    env: s(snap.env),
    origin: s<t.SlugUrlOrigin | undefined>(),
    cardKind: s(snap.cardKind),
  };
  const orchestrator = createOrchestrator({ props, card });
  const p = props;
  const api = {
    props,
    card,
    orchestrator,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
    Signal.listen(card.props, true);
  }

  function reset() {
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
    p.env.value = defaults.env;
    p.cardKind.value = defaults.cardKind;
    card.reset();
    orchestrator.reset();
    syncOrigin();
  }

  function syncOrigin() {
    const env = p.env.value ?? defaults.env!;
    p.origin.value = Dev.SlugOrigin.Default.spec[env];
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.env = p.env.value;
      d.cardKind = p.cardKind.value;
    });
  });

  Signal.effect(syncOrigin);
  syncOrigin();
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
  };

  const cards = DataCards.createPanel({
    signals: debug.card,
    origin: v.origin,
    env: v.env,
    theme: v.theme,
    debug: v.debug,
    kind: v.cardKind,
    kinds: ['file-content', 'playback-content'],
    onKindSelect: (kind) => {
      if (p.cardKind.value === kind) return;
      p.cardKind.value = kind;
      debug.orchestrator.reset();
      debug.card.props.treeContent.ref.value = undefined;
      debug.card.props.treeContent.refs.value = undefined;
      debug.card.props.treePlayback.ref.value = undefined;
      debug.card.props.treePlayback.refs.value = undefined;
    },
    style: props.style,
  });

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>
      <Dev.SlugOrigin.UI
        debug={v.debug}
        env={p.env}
        origin={p.origin}
        style={{ MarginY: [15, 30] }}
      />

      {cards}

      <hr style={{ marginTop: 60, borderTopWidth: 4, opacity: 0.5 }} />
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
