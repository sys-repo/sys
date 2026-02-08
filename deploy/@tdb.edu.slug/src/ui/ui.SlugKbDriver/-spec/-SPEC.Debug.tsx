import React from 'react';
import { Dev } from '../../-dev/mod.ts';
import { SelectedPath } from '../../ui.TreeHost/-spec/mod.ts';
import { SlugData } from './-ui.SlugData.tsx';
import { type t } from './common.ts';
import {
  ActionProbe,
  Button,
  Color,
  css,
  D,
  EffectController,
  Is,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  SlugKbDriver,
  TreeHost,
} from './mod.ts';

type P = t.TreeHostProps;
type Storage = Pick<P, 'debug' | 'theme' | 'selectedPath'> & {
  env?: t.HttpOriginEnv;
};
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  env: 'production',
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

  const defaultBaseUrl: t.StringUrl = 'https://slc.db.team/';
  const controller = s(SlugKbDriver.Controller.create({ baseUrl: defaultBaseUrl }));
  const action = ActionProbe.Signals.create();

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    tree: s<P['tree']>(undefined),
    selectedPath: s(snap.selectedPath),
    env: s(snap.env),
    origin: s<t.SlugUrlOrigin | undefined>(),
    treeContentRef: s<string | undefined>(undefined),
    treeContentRefs: s<string[] | undefined>(undefined),
    ...action.props,
  };
  const p = props;
  const api = {
    props,
    controller,
    action,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
    Signal.listen({ controller }, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    const env = p.env.value ?? 'production';
    p.env.value = env;
    p.origin.value = Dev.SlugOrigin.Default.spec[env];
    action.reset();
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.selectedPath = p.selectedPath.value;
      d.env = p.env.value;
    });
  });

  Signal.effect(() => {
    if (Is.localhost()) return;
    if (p.env.value === 'localhost') p.env.value = 'production';
  });

  Signal.effect(() => {
    const baseUrl = p.origin.value?.app ?? defaultBaseUrl;
    const prev = controller.value;
    if (prev.props.baseUrl === baseUrl) return;
    const next = SlugKbDriver.Controller.create({ baseUrl });
    controller.value = next;
    prev.dispose();
  });

  /**
   * Baseline invariant: no tree => no selected path.
   * Prevents stale persisted path from enabling Back before tree is loaded.
   */
  Signal.effect(() => {
    if (p.tree.value) return;
    if (!p.selectedPath.value) return;
    p.selectedPath.value = undefined;
  });

  Signal.effect(() => {
    if (p.tree.value) return;
    if (!p.treeContentRef.value && !p.treeContentRefs.value) return;
    p.treeContentRef.value = undefined;
    p.treeContentRefs.value = undefined;
  });

  /**
   * Bridge (dev harness): Signals → EffectController
   * Feeds reactive harness inputs into the controller under test.
   */
  Signal.effect(() => {
    const tree = p.tree.value;
    const selectedPath = p.selectedPath.value;
    controller.value.next({ tree, selectedPath });
  });

  Signal.effect(() => {
    const node = TreeHost.Data.findViewNode(p.tree.value, p.selectedPath.value);
    const ref =
      node?.value && 'ref' in node.value && Is.str(node.value.ref) ? node.value.ref : undefined;
    if (!ref) return;
    if (p.treeContentRef.value === ref) return;
    p.treeContentRef.value = ref;
  });

  Signal.effect(() => {
    if (!p.tree.value || !p.treeContentRef.value) return;
    const current = TreeHost.Data.findViewNode(p.tree.value, p.selectedPath.value);
    if (current) return;
    const next = TreeHost.Data.findPathByRef(p.tree.value, p.treeContentRef.value);
    if (!next) return;
    p.selectedPath.value = next;
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
  const controller = debug.controller.value;
  const p = debug.props;
  const v = Signal.toObject(p);

  Signal.useRedrawEffect(debug.listen);
  const state = EffectController.useEffectController(controller);

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
      <Dev.SlugOrigin.UI debug={v.debug} env={p.env} origin={p.origin} style={{ marginTop: 15 }} />
      <SlugData debug={debug} />
      <hr />
      <SlugKbDriver.Dev.DriverInfo style={{ MarginY: [10, 50] }} controller={controller} />
      <hr />
      <SelectedPath theme={theme.name} signal={p.selectedPath} style={{ MarginY: 15 }} />

      <hr style={{ borderTopWidth: 4, opacity: 0.5 }} />

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button
        block
        label={() => '(clear tree)'}
        enabled={!!v.tree}
        onClick={() => {
          p.tree.value = undefined;
          p.selectedPath.value = undefined;
          p.treeContentRefs.value = undefined;
          p.treeContentRef.value = undefined;
        }}
      />
      <Button
        block
        label={() => '(clear probe.ref)'}
        enabled={!!v.treeContentRef}
        onClick={() => {
          p.treeContentRef.value = undefined;
          debug.action.focus('tree-content');
        }}
      />
      <Button block label={() => '(reset)'} onClick={debug.reset} />

      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView name={'state'} data={state} expand={0} style={{ marginTop: 6 }} />
    </div>
  );
};
