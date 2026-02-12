import React from 'react';
import { DataCards } from '../../-dev/ui.Http.DataCards/mod.ts';
import { Dev } from '../../-dev/mod.ts';
import { TreeSelectionCardOrchestrator, TreeSelectionController } from '../../m.effects/mod.ts';
import { type t, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { PropSlots } from './-ui.prop.slots.tsx';

type P = t.TreeHostProps;
type Storage = {
  debug?: P['debug'];
  theme?: P['theme'];
  env?: t.HttpOriginEnv;
  cardKind?: t.DataCardKind;
};
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  env: 'localhost',
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
  const snap = { ...defaults, ...store.current };
  const card = DataCards.createSignals({ totalVisible: 3 });
  const selection = TreeSelectionController.create();

  type S = t.TreeHostSlots;
  const slots = {
    tree: s<S['tree']>(),
    main: s<S['main']>(),
    aux: s<S['aux']>(),
  };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    slots,
    env: s(snap.env),
    origin: s<t.SlugUrlOrigin | undefined>(),
    cardKind: s(snap.cardKind),
  };
  const cards = TreeSelectionCardOrchestrator.create({
    selection,
    cardKind: props.cardKind,
    card: card.props,
    tree: { fromResponse: DataCards.Helpers.treeFromResponse },
  });
  const p = props;
  const api = {
    props,
    card,
    selection,
    cards,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
    Signal.listen(card.props, true);
  }

  function reset() {
    Signal.walk(props, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    selection.intent({ type: 'tree.clear' });
    selection.intent({ type: 'reset' });
    card.reset();
    syncOrigin();
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.env = p.env.value;
      d.cardKind = p.cardKind.value;
    });
  });

  function syncOrigin() {
    const env = p.env.value ?? defaults.env!;
    p.origin.value = Dev.SlugOrigin.Default.spec[env];
  }
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

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Dev.SlugOrigin.UI
        debug={v.debug}
        env={p.env}
        origin={p.origin}
        style={{ MarginY: [10, 20] }}
      />
      {DataCards.createPanel({
        signals: debug.card,
        origin: v.origin,
        env: v.env,
        theme: v.theme,
        debug: v.debug,
        kind: v.cardKind,
        kinds: ['file-content', 'playback-content'],
        onKindSelect(kind) {
          if (p.cardKind.value === kind) return;
          p.cardKind.value = kind;
          debug.selection.intent({ type: 'tree.clear' });
          debug.selection.intent({ type: 'reset' });
          debug.card.reset();
        },
      })}

      <hr />
      <PropSlots debug={debug} />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
