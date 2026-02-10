import React from 'react';
import { type t, BulletList, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from './common.ts';

import { SelectedPath, TreeHost } from './mod.ts';
import { SAMPLE_TREE_1, SAMPLE_TREE_2 } from './-u.sample.data.ts';
import { Foo } from './-ui.Foo.tsx';
import { PropSpinner } from './-ui.prop.spinner.tsx';

type P = t.TreeHostProps;
type Storage = Pick<P, 'debug' | 'theme' | 'selectedPath' | 'spinner'> & {
  customEmpty?: boolean;
};
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  customEmpty: false,
};

export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

export function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  type S = t.TreeHostSlots;
  const slots = {
    tree: s<S['tree']>(),
    main: s<S['main']>(),
    aux: s<S['aux']>(),
  };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    tree: s<P['tree']>(SAMPLE_TREE_1),
    selectedPath: s(snap.selectedPath),
    spinner: s(snap.spinner),
    slots,
    customEmpty: s(snap.customEmpty),
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(props, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    props.tree.value = SAMPLE_TREE_1;
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = props.theme.value;
      d.debug = props.debug.value;
      d.selectedPath = props.selectedPath.value;
      d.spinner = props.spinner.value;
      d.customEmpty = props.customEmpty.value;
    });
  });

  Signal.effect(() => {
    const path = props.selectedPath.value;
    const tree = props.tree.value;
    const node = tree
      ? TreeHost.Data.find(tree, ({ node }) => Obj.Path.eql(node.path, path ?? []))
      : undefined;
    console.info('👁️ selectedPath:', path, 'node:', node);
  });

  return { props, listen, reset };
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

export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

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
      <PropSpinner debug={debug} />

      <hr />
      <Button block label={() => `tree: sample-1`} onClick={() => (p.tree.value = SAMPLE_TREE_1)} />
      <Button block label={() => `tree: sample-2`} onClick={() => (p.tree.value = SAMPLE_TREE_2)} />
      <Button block label={() => `tree: (clear)`} onClick={() => (p.tree.value = undefined)} />

      <hr />
      <SelectedPath theme={theme.name} signal={p.selectedPath} style={{ MarginY: 15 }} />

      <hr />
      <Button
        block
        label={() => `slot: empty ${p.customEmpty.value ? '🐚' : ''}`}
        onClick={() => Signal.toggle(p.customEmpty)}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};

function spinnerSelection(value: P['spinner']) {
  const current = JSON.stringify(value ?? null);
  const hit = SPINNER_OPTIONS.find((item) => JSON.stringify(item.value ?? null) === current);
  return hit?.id;
}
