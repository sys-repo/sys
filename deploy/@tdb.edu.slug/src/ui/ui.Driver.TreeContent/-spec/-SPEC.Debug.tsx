import React from 'react';
import { DataCards } from '../../-dev/ui.Http.DataCards/mod.ts';
import { createCardOrchestrator } from './-u.data-card.orchestrator.ts';
import { createDataCards } from './-u.data-cards.ts';
import { useEffectControllers } from './-use.EffectControllers.ts';
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

export type DebugCardPolicy = {
  readonly defaultKind: t.DataCardKind;
  readonly kinds: readonly t.DataCardKind[];
  readonly allowKindSelect: boolean;
};

type CreateDebugSignalsArgs = {
  readonly card?: Partial<DebugCardPolicy>;
};

const defaultCardPolicy: DebugCardPolicy = {
  defaultKind: 'file-content',
  kinds: ['file-content', 'playback-content'],
  allowKindSelect: true,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals(args: CreateDebugSignalsArgs = {}) {
  const cardPolicy = normalizeCardPolicy(args.card);
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;
  const card = DataCards.createSignals({ totalVisible: 3, persist: store });
  const initialKind = wrangle.cardKind(snap.cardKind, cardPolicy);

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    env: s(snap.env),
    origin: s<t.SlugUrlOrigin | undefined>(),
    cardKind: s(initialKind),
  };
  const orchestrator = createCardOrchestrator({ props, card });
  const p = props;
  const api = {
    props,
    card,
    cardPolicy,
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
    p.cardKind.value = wrangle.cardKind(undefined, cardPolicy);
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

function normalizeCardPolicy(input: Partial<DebugCardPolicy> | undefined): DebugCardPolicy {
  const kinds = input?.kinds?.length ? [...input.kinds] : [...defaultCardPolicy.kinds];
  const fallback = defaultCardPolicy.defaultKind;
  const requested = input?.defaultKind ?? fallback;
  const defaultKind = kinds.includes(requested) ? requested : (kinds[0] ?? fallback);
  return {
    defaultKind,
    kinds,
    allowKindSelect: input?.allowKindSelect ?? defaultCardPolicy.allowKindSelect,
  };
}

const wrangle = {
  cardKind(input: t.DataCardKind | undefined, policy: DebugCardPolicy) {
    const kind = input ?? policy.defaultKind;
    return policy.kinds.includes(kind) ? kind : policy.defaultKind;
  },
} as const;

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
  const { selection, content } = useEffectControllers(debug);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>
      <Dev.SlugOrigin.UI
        debug={v.debug}
        env={p.env}
        origin={p.origin}
        style={{ MarginY: [15, 30] }}
      />

      {createDataCards(debug)}

      <hr style={{ marginTop: 60, borderTopWidth: 4, opacity: 0.5 }} />
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView name={'content'} data={content} style={{ marginTop: 5 }} expand={0} />
      <ObjectView name={'selection'} data={selection} style={{ marginTop: 5 }} expand={0} />

      <div style={{ height: 50 }} />
    </div>
  );
};
