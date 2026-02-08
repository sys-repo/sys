import React from 'react';
import { Dev } from '../../-dev/mod.ts';
import type * as tSlugLoader from '../../-dev/ui.Http.SlugLoader/-spec/t.ts';
import { SelectedPath } from '../../ui.TreeHost/-spec/mod.ts';
import { SlugData } from './-ui.SlugData.tsx';
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
  SlugLoader,
  SlugKbDriver,
  type t,
  TreeHost,
} from './mod.ts';

type P = t.TreeHostProps;
export type ContentData = tSlugLoader.FileContentData;
type Storage = Pick<P, 'debug' | 'theme' | 'selectedPath'> & {
  env?: t.HttpOriginEnv;
  treeContentRef?: string;
  treeContentRefs?: string[];
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
    //
    contentData: s<ContentData | undefined>(),
    contentStatus: s<'idle' | 'loading' | 'ready' | 'error'>('idle'),
    contentError: s<string | undefined>(),
    treeContentRef: s(snap.treeContentRef),
    treeContentRefs: s(snap.treeContentRefs),
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
      d.treeContentRef = p.treeContentRef.value;
      d.treeContentRefs = p.treeContentRefs.value;
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

  let contentReq = 0;
  Signal.effect(() => {
    const origin = p.origin.value?.cdn.default;
    const ref = p.treeContentRef.value;
    if (!origin || !ref) {
      contentReq++;
      p.contentData.value = undefined;
      p.contentStatus.value = 'idle';
      p.contentError.value = undefined;
      p.result.items.value = [];
      p.result.response.value = {};
      p.result.obj.value = { expand: { paths: ['$'] } };
      action.end();
      return;
    }

    const req = ++contentReq;
    action.start('tree-content', 'Tree + FileContent');
    p.contentStatus.value = 'loading';
    p.contentError.value = undefined;

    void (async () => {
      try {
        const kind: t.BundleDescriptorKind = 'slug-tree:fs';
        const client = await SlugLoader.Descriptor.client({ origin, kind });
        if (req !== contentReq) return;
        if (!client.ok) return fail(client.error?.message ?? 'Failed to create slug client.');

        const tree = await client.value.Tree.load();
        if (req !== contentReq) return;
        if (!tree.ok) return fail(tree.error?.message ?? 'Failed to load slug-tree.');

        const index = await client.value.FileContent.index();
        if (req !== contentReq) return;
        if (!index.ok) return fail(index.error?.message ?? 'Failed to load content index.');

        const hash = findHash(index.value.entries, ref);
        if (!hash) return fail(`No content hash found for ref: ${ref}`);

        const content = await client.value.FileContent.get(hash);
        if (req !== contentReq) return;
        if (!content.ok) return fail(content.error?.message ?? `Failed to load content for ref: ${ref}`);

        const data: ContentData = {
          docid: client.value.docid,
          ref,
          hash,
          tree: tree.value,
          content: content.value,
          contentIndex: index.value,
        };
        p.contentData.value = data;
        p.contentStatus.value = 'ready';
        p.result.items.value = buildResultItems(data, origin, client.value.baseUrl);
        action.result({ ok: true, value: data }, { expand: { paths: ['$'] } });
      } finally {
        if (req === contentReq) action.end();
      }

      function fail(message: string) {
        p.contentData.value = undefined;
        p.contentStatus.value = 'error';
        p.contentError.value = message;
        p.result.items.value = [];
        action.result({ ok: false, error: message }, { expand: { paths: ['$'] } });
      }
    })();
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

  /**
   * Keep probe selection in-sync with TreeHost selection.
   */
  Signal.effect(() => {
    const tree = p.tree.value;
    const path = p.selectedPath.value;
    const node = TreeHost.Data.findViewNode(tree, path);
    const ref = node?.value && 'ref' in node.value && Is.str(node.value.ref) ? node.value.ref : undefined;
    if (p.treeContentRef.value === ref) return;
    p.treeContentRef.value = ref;
    if (ref) action.focus('tree-content');
  });

  return api;
}

function findHash(entries: readonly t.SlugFileContentEntry[], ref: string): string | undefined {
  const entry = entries.find((item) => item.frontmatter?.ref === ref || item.path === ref);
  return entry?.hash;
}

function buildResultItems(
  data: ContentData,
  origin: string,
  baseUrl: string,
): t.KeyValueItem[] {
  const frontmatter = data.content.frontmatter;
  return [
    { k: 'origin', v: origin },
    { k: 'base-url', v: baseUrl },
    { k: 'doc-id', v: data.docid },
    { k: 'ref', v: data.ref },
    { k: 'hash', v: data.hash },
    { k: 'content-type', v: data.content.contentType },
    { kind: 'hr' },
    { k: 'title', v: frontmatter?.title ?? '(none)' },
    { k: 'refs: loaded', v: data.contentIndex.entries.length },
    { k: 'tree: items', v: data.tree.tree.length },
    { k: 'content-index: entries', v: data.contentIndex.entries.length },
    { k: 'content-frontmatter: entries', v: totalKeys(frontmatter) },
  ];
}

function totalKeys(input: unknown) {
  if (!Is.object(input)) return 0;
  const keys: string[] = [];
  Obj.walk(input, (e) => keys.push(String(e.key)));
  return keys.length;
}

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
      <Dev.SlugOrigin.UI debug={v.debug} env={p.env} origin={p.origin} style={{ marginTop: 10 }} />
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
