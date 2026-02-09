import React from 'react';
import { Button, ObjectView } from '../../u.ts';

import { type t, css, D, LocalStorage, Obj, Signal, Str } from './common.ts';
import { IndexTreeView } from '../mod.ts';
import { SAMPLE_YAML } from './-u.yaml.ts';

type P = t.IndexTreeViewProps;
type Storage = Pick<P, 'theme' | 'debug' | 'path' | 'showChevron' | 'indentSize' | 'spinning'> & {
  yaml?: string;
  renderLeaf?: boolean;
};
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  showChevron: D.showChevron,
  indentSize: D.indentSize,
  spinning: false,
  renderLeaf: false,
  yaml: SAMPLE_YAML,
  path: undefined,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    yaml: s(snap.yaml),
    path: s(snap.path),
    showChevron: s(snap.showChevron),
    indentSize: s(snap.indentSize),
    spinning: s(snap.spinning),
    renderLeaf: s(snap.renderLeaf ?? defaults.renderLeaf),
  };
  const p = props;
  const api = {
    props,
    get root() {
      const text = p.yaml.value;
      return text ? IndexTreeView.Data.Yaml.parse(text) : undefined;
    },
    listen() {
      Signal.listen(props);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.yaml = p.yaml.value;
      d.path = p.path.value;
      d.showChevron = p.showChevron.value;
      d.indentSize = p.indentSize.value;
      d.spinning = p.spinning.value;
      d.renderLeaf = p.renderLeaf.value;
    });
  });

  /** Observe to relevant changes */
  Signal.effect(() => {
    console.info('👁️ path:', p.path.value);
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
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
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>🌳 {D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => {
          const v = p.yaml.value;
          return `yaml: ${v ? `"${Str.truncate(v, 35)}"` : `(undefined)`}`;
        }}
        onClick={() => Signal.cycle(p.yaml, [SAMPLE_YAML, undefined])}
      />
      <Button
        block
        enabled={() => !p.renderLeaf.value}
        label={() => `showChevron: ${p.showChevron.value}`}
        onClick={() => {
          type T = t.IndexTreeViewChevronMode;
          Signal.cycle<T>(p.showChevron, [D.showChevron, 'always', 'never']);
        }}
      />
      <Button
        block
        label={() => `indentSize: ${p.indentSize.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle(p.indentSize, [10, D.indentSize, 32])}
      />
      <Button
        block
        label={() => `spinning: ${p.spinning.value}`}
        onClick={() => Signal.toggle(p.spinning)}
      />

      <hr />
      <Button
        //
        block
        label={() => `path: (clear)`}
        onClick={() => (p.path.value = undefined)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `renderLeaf (element): ${p.renderLeaf.value}`}
        onClick={() => Signal.toggle(p.renderLeaf)}
      />
      <Button
        block
        label={() => `(reset)`}
        onClick={() => Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)))}
      />
      <ObjectView
        name={'debug'}
        data={{
          ...Signal.toObject(p),
          yaml: Str.truncate(p.yaml.value ?? '', 35),
          root: debug.root,
        }}
        expand={1}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
