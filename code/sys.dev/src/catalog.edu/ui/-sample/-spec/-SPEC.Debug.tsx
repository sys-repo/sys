import React from 'react';
import { createRepo, YamlObjectView } from '../../../../ui/-test.ui.ts';
import { Str, Yaml } from '../common.ts';

type O = Record<string, unknown>;

import {
  type t,
  Button,
  css,
  D,
  LocalStorage,
  Monaco,
  Obj,
  ObjectView,
  Signal,
} from '../common.ts';

type P = t.SampleProps;
type Storage = Pick<P, 'theme' | 'debug' | 'path'> & { render: boolean };
const defaults: Storage = {
  debug: true,
  theme: 'Dark',
  path: ['foo'],
  render: true,
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
    debug: s(snap.debug),
    theme: s(snap.theme),
    path: s(snap.path),
    render: s(snap.render),
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
      d.debug = p.debug.value;
      d.render = p.render.value;
      d.theme = p.theme.value;
      d.path = p.path.value;
    });
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
   * Helpers:
   */
  function changeYaml(fn: (args: { draft: O; path: t.ObjectPath }) => void) {
    const doc = debug.signals.doc.value;
    const path = p.path.value;
    if (!!doc && !!path) {
      doc.change((draft) => fn({ draft, path }));
    }
  }

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

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
          const v = p.path.value;
          return `path: ${v ? `"${v.join(' / ')}"` : `<undefined>`}`;
        }}
        onClick={() =>
          Signal.cycle(p.path, [['foo'], ['my-text'], ['slug', 'foo', 'bar'], undefined])
        }
      />

      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      <Button
        block
        label={() => `change: 🌳 { working slug }`}
        onClick={() => {
          Yaml;

          const yaml = Str.dedent(`
          foo:
            id: example-slug
            traits:
              - as: primary
                id: video
            props:
              primary:
                src: "video.mp4"
            `);

          changeYaml((e) => {
            Obj.Path.Mutate.set(e.draft, e.path, yaml);
          });
        }}
      />
      <Button
        block
        label={() => `change: 🐷 (invalid yaml)`}
        onClick={() => {
          const yaml = Str.dedent(`
          foo: 
            - 123
            - 456
          `);
          changeYaml((e) => Obj.Path.Mutate.set(e.draft, e.path, yaml));
        }}
      />

      <Button
        block
        label={() => `change: 💥 (break) ← cause error condition`}
        onClick={() => {
          changeYaml((e) => Obj.Path.Mutate.set(e.draft, e.path, { fail: '💥' }));
        }}
      />

      <hr style={{ marginTop: 20 }} />

      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
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

      <ObjectView
        style={{ marginTop: 15 }}
        expand={1}
        name={'catalog'}
        data={{ 'schema:slug': '🐷' }}
      />
    </div>
  );
};
