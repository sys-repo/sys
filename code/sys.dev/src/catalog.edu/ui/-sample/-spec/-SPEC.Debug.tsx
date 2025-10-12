import React from 'react';
import { CatalogObjectView } from '../../-dev/mod.ts';
import { createRepo, YamlObjectView } from '../../../../ui/-test.ui.ts';
import {
  type t,
  Arr,
  Button,
  css,
  D,
  LocalStorage,
  Monaco,
  Obj,
  ObjectView,
  Signal,
  Str,
  Yaml,
} from '../common.ts';
import { yamlSamples } from './-u.yamlSamples.tsx';

type O = Record<string, unknown>;
type P = t.SampleProps;
type Storage = Pick<P, 'theme' | 'debug' | 'docPath' | 'slugPath'> & {
  render: boolean;
  hostPadding?: boolean;
};
const defaults: Storage = {
  render: true,
  debug: true,
  theme: 'Dark',
  docPath: ['foo'],
  slugPath: ['slug'],
  hostPadding: true,
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

  const signals: t.YamlEditorSignals = {
    doc: s(),
    yaml: s(),
    editor: s(),
    monaco: s(),
  };
  const props = {
    render: s(snap.render),
    debug: s(snap.debug),
    theme: s(snap.theme),
    docPath: s(snap.docPath),
    slugPath: s(snap.slugPath),
    hostPadding: s(snap.hostPadding),

    slug: s<t.Slug | undefined>(),
  };

  const p = props;
  const api = {
    props,
    bus$: Monaco.Bus.make(),
    repo: createRepo(),
    signals,
    reset,
    listen,
  };

  function listen() {
    Signal.listen(props);
    Signal.listen(signals, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.render = p.render.value;
      d.hostPadding = p.hostPadding.value;
      d.debug = p.debug.value;
      d.theme = p.theme.value;
      d.docPath = p.docPath.value;
      d.slugPath = p.slugPath.value;
    });
  });

  Signal.effect(() => {
    const next = signals.yaml.value?.data.value as t.Slug | undefined;
    p.slug.value = next;
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
  const s = debug.signals;
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = { base: css({}) };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{D.name}</div>
        <div>{'(Slug)'}</div>
      </div>
      <Button
        block
        label={() => `render: ${p.render.value}`}
        onClick={() => Signal.toggle(p.render)}
      />
      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => {
          const v = p.docPath.value;
          return `doc path: ${Arr.isArray(v) ? `[${v}]` : v}`;
        }}
        onClick={() => Signal.cycle(p.docPath, [['foo'], ['foo', 'bar'], undefined])}
      />
      <Button
        block
        label={() => {
          const v = p.slugPath.value;
          return `slug path: ${Arr.isArray(v) ? `[${v}]` : v}`;
        }}
        onClick={() => {
          Signal.cycle(p.slugPath, [['slug'], ['hello'], ['my', 'deep', 'nesting'], undefined]);
        }}
      />
      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      {yamlSamples(debug)}
      <hr style={{ marginTop: 40 }} />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `host padding: ${p.hostPadding.value}`}
        onClick={() => Signal.toggle(p.hostPadding)}
      />
      <Button
        block
        label={() => `(reset, reload)`}
        onClick={() => {
          debug.reset();
          window.location.reload();
        }}
      />
      <ObjectView style={{ marginTop: 15 }} expand={0} name={'debug'} data={Signal.toObject(p)} />
      <hr />
      <YamlObjectView
        style={{ marginTop: 5 }}
        bus$={debug.bus$}
        doc={s.doc?.value}
        editor={s.editor?.value}
      />
      <CatalogObjectView
        style={{ marginTop: 15 }}
        expand={1}
        slug={{ path: p.slugPath.value, value: p.slug.value }}
      />
    </div>
  );
};
