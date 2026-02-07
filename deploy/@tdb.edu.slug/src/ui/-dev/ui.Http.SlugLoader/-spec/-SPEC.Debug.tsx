import React from 'react';
import { Dev } from '../../mod.ts';
import {
  type t,
  ActionProbe,
  Button,
  Color,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
} from '../common.ts';
import { renderSamples } from './-u.samples.tsx';

type DescriptorMode = t.BundleDescriptorKind;
type Storage = {
  debug?: boolean;
  theme?: t.CommonTheme;
  env?: t.HttpOriginEnv;
  descriptorKind?: DescriptorMode;
  treeContentRef?: string;
  treeContentRefs?: string[];
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  descriptorKind: 'slug-tree:fs',
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
  const action = ActionProbe.Signals.create();

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    env: s(snap.env),
    descriptorKind: s(normalizeDescriptorMode(snap.descriptorKind)),
    treeContentRef: s(snap.treeContentRef),
    treeContentRefs: s(snap.treeContentRefs),
    origin: s<t.SlugUrlOrigin | undefined>(),
    ...action.props,
  };
  const p = props;
  const api = {
    props,
    action,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    action.reset();
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.env = p.env.value;
      d.descriptorKind = p.descriptorKind.value;
      d.treeContentRef = p.treeContentRef.value;
      d.treeContentRefs = p.treeContentRefs.value;
    });
  });

  Signal.effect(() => {
    if (isBrowserLocalhost()) return;
    if (p.env.value === 'localhost') p.env.value = 'production';
  });

  return api;
}

function normalizeDescriptorMode(input: unknown): DescriptorMode {
  return isDescriptorMode(input) ? input : 'slug-tree:fs';
}

function isDescriptorMode(input: unknown): input is DescriptorMode {
  return input === 'slug-tree:fs' || input === 'slug-tree:media:seq';
}

function isBrowserLocalhost(): boolean {
  const hostname = globalThis.location?.hostname;
  if (!hostname) return true;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
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

  /**F
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
      <hr style={{ marginTop: 10, marginBottom: 10 }} />

      <Dev.SlugOrigin.UI
        debug={v.debug}
        env={p.env}
        origin={p.origin}
        style={{ marginTop: 10, marginBottom: 30 }}
      />
      {renderSamples(debug, { theme: theme.name })}
      <hr style={{ marginTop: 70, borderTopWidth: 5, opacity: 0.4 }} />

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
