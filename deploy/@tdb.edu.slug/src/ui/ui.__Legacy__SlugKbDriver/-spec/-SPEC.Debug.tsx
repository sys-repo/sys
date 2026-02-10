import React from 'react';
import { Dev } from '../../-dev/mod.ts';
import { TreeSelectionController } from '../../m.effects/mod.ts';
import { SlugActionProbe } from './-ui.ActionProbe.tsx';
import { type t } from './common.ts';
import {
  ActionProbe,
  Button,
  Color,
  css,
  D,
  Effect,
  Is,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  SlugLoader,
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
  env: Is.localhost() ? 'localhost' : 'production',
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
  const treeEffect = s(TreeSelectionController.create());
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
    contentData: s<t.FileContentData | undefined>(undefined),
    contentLoading: s(false),
    contentKey: s<string | undefined>(undefined),
    ...action.props,
  };
  const p = props;
  const api = {
    props,
    controller,
    treeEffect,
    action,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
    Signal.listen({ controller }, true);
    Signal.listen({ treeEffect }, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    const env = p.env.value ?? 'production';
    p.env.value = env;
    p.origin.value = Dev.SlugOrigin.Default.spec[env];
    p.contentData.value = undefined;
    p.contentKey.value = undefined;
    p.contentLoading.value = false;
    treeEffect.value.intent({ type: 'reset' });
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

  Signal.effect(() => {
    const tree = p.tree.value;
    if (tree) treeEffect.value.intent({ type: 'tree.set', tree });
    else treeEffect.value.intent({ type: 'tree.clear' });
  });

  Signal.effect(() => {
    treeEffect.value.intent({ type: 'path.request', path: p.selectedPath.value });
  });

  Signal.effect(() => {
    treeEffect.value.intent({ type: 'ref.request', ref: p.treeContentRef.value });
  });

  Signal.effect(() => {
    const rev = treeEffect.value.rev;
    const state = treeEffect.value.current();
    const nextPath = state.selectedPath;
    const nextRef = state.selectedRef;
    if (!Obj.Path.eql(nextPath, p.selectedPath.value)) p.selectedPath.value = nextPath;
    if (nextRef !== p.treeContentRef.value) p.treeContentRef.value = nextRef;
  });

  Signal.effect(() => {
    const state = treeEffect.value.current();
    controller.value.next({
      tree: state.tree,
      selectedPath: state.selectedPath,
    });
  });

  let requestId = 0;
  Signal.effect(() => {
    const origin = p.origin.value?.cdn.default;
    const tree = p.tree.value;
    const selectedPath = p.selectedPath.value;
    const selectedRef = treeEffect.value.current().selectedRef;
    const node = TreeHost.Data.findViewNode(tree, selectedPath);
    const isLeaf = !!node && (node.children?.length ?? 0) === 0;
    const key = origin && selectedRef && isLeaf ? `${origin}:${selectedRef}` : undefined;
    const loadOrigin = origin;
    const loadRef = selectedRef;

    if (!key || !loadOrigin || !loadRef) {
      p.contentData.value = undefined;
      p.contentKey.value = undefined;
      p.contentLoading.value = false;
      return;
    }
    if (p.contentKey.value === key && p.contentData.value) return;

    p.contentKey.value = key;
    p.contentData.value = undefined;
    p.contentLoading.value = true;

    const thisRequest = ++requestId;
    void loadContentFile(loadOrigin, loadRef)
      .then((data) => {
        if (thisRequest !== requestId) return;
        p.contentLoading.value = false;
        p.contentData.value = data;
      })
      .catch(() => {
        if (thisRequest !== requestId) return;
        p.contentLoading.value = false;
        p.contentData.value = undefined;
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
  const controller = debug.controller.value;
  const p = debug.props;
  const v = Signal.toObject(p);

  Signal.useRedrawEffect(debug.listen);
  const state = Effect.useEffectController(controller);

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
      <hr style={{ marginBottom: 10, opacity: 0 }} />
      <SlugActionProbe debug={debug} />

      <hr style={{ borderTopWidth: 4, opacity: 0.5, marginTop: 50 }} />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => '(clear tree)'}
        enabled={!!v.tree}
        onClick={() => {
          p.tree.value = undefined;
          p.selectedPath.value = undefined;
          p.treeContentRefs.value = undefined;
          p.treeContentRef.value = undefined;
          p.contentData.value = undefined;
          p.contentKey.value = undefined;
          p.contentLoading.value = false;
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

async function loadContentFile(
  origin: string,
  ref: string,
): Promise<t.FileContentData | undefined> {
  const kind: t.BundleDescriptorKind = 'slug-tree:fs';
  const client = await SlugLoader.Descriptor.client({ origin, kind });
  if (!client.ok) return undefined;

  const tree = await client.value.Tree.load();
  if (!tree.ok) return undefined;

  const index = await client.value.FileContent.index();
  if (!index.ok) return undefined;

  const hash = findHash(index.value.entries, ref);
  if (!hash) return undefined;

  const content = await client.value.FileContent.get(hash);
  if (!content.ok) return undefined;

  return {
    docid: client.value.docid,
    ref,
    hash,
    tree: tree.value,
    content: content.value,
    contentIndex: index.value,
  };
}

function findHash(entries: readonly t.SlugFileContentEntry[], ref: string): string | undefined {
  const entry = entries.find((item) => item.frontmatter?.ref === ref || item.path === ref);
  return entry?.hash;
}
