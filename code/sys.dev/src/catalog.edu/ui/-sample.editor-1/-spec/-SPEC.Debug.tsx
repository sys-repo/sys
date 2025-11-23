import React from 'react';
import { CatalogObjectView } from '../../-dev/mod.ts';
import { createUiRepo, DevUrl, YamlObjectView } from '../../-test.ui.ts';
import {
  type t,
  Arr,
  Button,
  Color,
  css,
  D,
  Icons,
  LocalStorage,
  Monaco,
  Obj,
  ObjectView,
  Signal,
  Str,
} from '../common.ts';
import { yamlSamples } from './-u.SAMPLES.tsx';
import { SlugView } from './-ui.SlugView.tsx';

type P = t.Sample1Props;
type Storage = Pick<P, 'theme' | 'debug' | 'docPath' | 'slugPath'> & {
  render: boolean;
  hostPadding?: boolean;
};
const defaults: Storage = {
  render: true,
  debug: false,
  theme: 'Dark',
  docPath: ['yaml'],
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

    // In-memory:
    slug: s<t.Slug | undefined>(),
    slugDiagnostics: s<t.Ary<t.Yaml.Diagnostic> | undefined>(),
  };

  const p = props;
  const api = {
    props,
    bus$: Monaco.Bus.make(),
    repo: createUiRepo(),
    url: DevUrl.make(window),
    signals,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
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

  // Sample: lift the parsed YAML data-value and store it on a root level signal.
  Signal.effect(() => {
    const next = signals.yaml.value?.data.value;
    p.slug.value = next as t.Slug | undefined;
  });

  Signal.effect((e) => {
    const doc = signals.doc.value;
    doc?.events(e.life.dispose$).$.subscribe((e) => {
      const p = e.patches.length;
      const patches = `${p}-${Str.plural(p, 'patch', 'patches')}`;
      console.info(`⚡️ Signal.effect(life):doc(${patches}):`, e);
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
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({}),
    vcenter: css({ display: 'flex', alignItems: 'center', gap: 6 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{D.name}</div>
        <div>{'YAML Editor'}</div>
      </div>

      <Button
        block
        label={() => (
          <div className={styles.vcenter.class}>
            <Icons.ClosePanel.Right />
            {`debug=false (via query-string → reload)`}
          </div>
        )}
        onClick={() => {
          debug.url.debug = false;
          window.location.reload();
        }}
      />

      <hr />
      <Button
        block
        label={() => `render: ${p.render.value}`}
        onClick={() => Signal.toggle(p.render)}
      />
      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => {
          const v = p.docPath.value;
          return `path doc: ${Arr.isArray(v) ? `[${v}]` : (v ?? '(undefined)')}`;
        }}
        onClick={() => Signal.cycle(p.docPath, [['yaml'], ['foo'], ['foo', 'bar'], undefined])}
      />
      <Button
        block
        label={() => {
          const v = p.slugPath.value;
          return `path doc/slug: ${Arr.isArray(v) ? `[${v}]` : (v ?? '(undefined)')}`;
        }}
        onClick={() => {
          Signal.cycle(p.slugPath, [['slug'], ['hello', 'world'], undefined]);
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
        label={() => `(reset → reload)`}
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
        style={{ marginTop: 5 }}
        expand={1}
        slug={{
          path: p.slugPath.value,
          value: p.slug.value,
          diagnostics: p.slugDiagnostics.value,
        }}
      />

      <SlugView
        theme={theme.name}
        slug={Obj.Path.get(p.slug.value, p.slugPath.value ?? ['404'])}
        style={{ marginTop: 50 }}
      />
    </div>
  );
};
