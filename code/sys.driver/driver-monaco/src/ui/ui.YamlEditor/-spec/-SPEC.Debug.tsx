import React from 'react';
import { YamlObjectView } from '../../-dev/mod.ts';

import { createUiRepo } from '../../-test.ui.ts';
import {
  type t,
  Button,
  Crdt,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Rx,
  Signal,
  STORAGE_KEY,
  Str,
} from '../common.ts';
import { normalizeSourcePath } from '../u.ts';

type P = t.YamlEditorProps;
type Storage = Pick<P, 'theme' | 'debug' | 'path' | 'diagnostics'> & {
  editor: Pick<
    t.YamlEditorMonacoProps,
    'margin' | 'minimap' | 'spinning' | 'enabled' | 'debounce' | 'wordWrap'
  >;
  documentId: Pick<t.YamlEditorDocumentIdProps, 'visible' | 'readOnly' | 'urlKey'>;
  footer: P['footer'];
  storeParsedYaml?: boolean;
  render?: boolean;
};

const defaults: Storage = {
  debug: false,
  render: true,
  storeParsedYaml: false,
  //
  theme: 'Dark',
  path: ['foo'],
  diagnostics: D.diagnostics,
  documentId: { visible: true, readOnly: false, urlKey: undefined },
  editor: {
    margin: 0,
    minimap: false,
    spinning: false,
    enabled: true,
    debounce: D.debounce,
    wordWrap: true,
  },
  footer: { visible: true, repo: true },
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

  const signals: P['signals'] = {
    doc: s<t.CrdtRef>(),
    yaml: s<t.EditorYaml | undefined>(),
    editor: s<t.Monaco.Editor | undefined>(),
  };

  const props = {
    render: s(snap.render),
    debug: s(snap.debug),
    storeParsedYaml: s(snap.storeParsedYaml),

    theme: s(snap.theme),
    path: s(snap.path),
    diagnostics: s(snap.diagnostics),

    documentId: {
      visible: s((snap.documentId ?? {}).visible),
      readOnly: s((snap.documentId ?? {}).readOnly),
      urlKey: s((snap.documentId ?? {}).urlKey),
      storageKey: STORAGE_KEY.DEV,
    },
    editor: {
      margin: s((snap.editor ?? {}).margin),
      minimap: s((snap.editor ?? {}).minimap),
      spinning: s((snap.editor ?? {}).spinning),
      enabled: s((snap.editor ?? {}).enabled),
      debounce: s((snap.editor ?? {}).debounce),
      wordWrap: s((snap.editor ?? {}).wordWrap),
    },
    footer: {
      visible: s((snap.footer ?? {}).visible),
      repo: s((snap.footer ?? {}).repo),
    },
  };

  const p = props;
  const api = {
    props,
    repo: createUiRepo(),
    bus$: Rx.subject<t.EditorEvent>(),
    signals,
    get path() {
      const storeYaml = p.storeParsedYaml.value;
      const path = normalizeSourcePath(p.path.value);
      return storeYaml && path
        ? { source: path, target: Obj.Path.appendSuffix(path, '.parsed') }
        : path;
    },
    reset,
    listen,
  };

  function listen() {
    Signal.listen(props);
    Signal.listen(props.documentId);
    Signal.listen(props.editor);
    Signal.listen(props.footer);
    Signal.listen(signals);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.debug = p.debug.value;
      d.render = p.render.value;
      d.storeParsedYaml = p.storeParsedYaml.value;

      d.path = p.path.value;
      d.diagnostics = p.diagnostics.value;
      d.theme = p.theme.value;

      d.editor = d.editor ?? {};
      d.editor.margin = p.editor.margin.value;
      d.editor.minimap = p.editor.minimap.value;
      d.editor.spinning = p.editor.spinning.value;
      d.editor.enabled = p.editor.enabled.value;
      d.editor.debounce = p.editor.debounce.value;
      d.editor.wordWrap = p.editor.wordWrap.value;

      d.documentId = d.documentId ?? {};
      d.documentId.visible = p.documentId.visible.value;
      d.documentId.readOnly = p.documentId.readOnly.value;
      d.documentId.urlKey = p.documentId.urlKey.value;

      d.footer = d.footer ?? {};
      d.footer.visible = p.footer.visible.value;
      d.footer.repo = p.footer.repo.value;
    });
  });

  Signal.effect((e) => {
    const doc = signals.doc?.value;
    doc?.events(e.life).$.subscribe((e) => {
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const s = debug.signals;
  const p = debug.props;
  const sourcePath = () => Obj.Path.appendSuffix(normalizeSourcePath(p.path.value), '.parsed');

  Signal.useRedrawEffect(() => debug.listen());
  Crdt.UI.useRev(s.doc?.value, {
    path: sourcePath(),
    onRedraw: (e) => console.info(`⚡️ onRedraw:`, e),
  });

  /**
   * Render:
   */
  const styles = { base: css({}) };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{`${D.name}`}</div>
        <div>{'YAML'}</div>
      </div>
      <Button
        block
        label={() => `render: ${p.render.value}`}
        onClick={() => Signal.toggle(p.render)}
      />

      <Button
        block
        label={() => {
          const v = p.storeParsedYaml.value;
          return `store parsed yaml: ${v} ${!v ? '← (memory only)' : ''}`;
        }}
        onClick={() => Signal.toggle(p.storeParsedYaml)}
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
          return `path: ${v ? `[ ${v} ]` : `<undefined>`}`;
        }}
        onClick={() => Signal.cycle(p.path, [['foo'], ['slug'], ['sample', 'deep'], undefined])}
      />

      <hr />
      <Button
        block
        label={() => `editor.margin: ${p.editor.margin.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.editor.margin, [0, 50, [100, 80], undefined])}
      />
      <Button
        block
        label={() => `editor.minimap: ${p.editor.minimap.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.editor.minimap)}
      />
      <Button
        block
        label={() => `editor.enabled: ${p.editor.enabled.value}`}
        onClick={() => Signal.toggle(p.editor.enabled)}
      />

      <Button
        block
        label={() => `editor.debounce: ${p.editor.debounce.value}`}
        onClick={() => Signal.cycle(p.editor.debounce, [0, 40, 100, 1000])}
      />
      <Button
        block
        label={() => `editor.spinning: ${p.editor.spinning.value}`}
        onClick={() => Signal.toggle(p.editor.spinning)}
      />
      <Button
        block
        label={() => `editor.wordWrap: ${p.editor.wordWrap.value}`}
        onClick={() => Signal.toggle(p.editor.wordWrap)}
      />

      <hr />
      <Button
        block
        label={() => `documentId.visible: ${p.documentId.visible.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.documentId.visible)}
      />
      <Button
        block
        label={() => `documentId.readOnly: ${p.documentId.readOnly.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.documentId.readOnly)}
      />
      <Button
        block
        label={() => `documentId.urlKey: ${p.documentId.urlKey.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.documentId.urlKey, ['foo', undefined])}
      />

      <hr />
      <Button
        block
        label={() => `footer.visible: ${p.footer.visible.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.footer.visible)}
      />
      <Button
        block
        label={() => `footer.repo: ${p.footer.repo.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.footer.repo)}
      />

      <hr />
      <div className={Styles.title.class}>{'Mutate'}</div>

      <Button
        block
        label={() => `delete: "${sourcePath()?.join('/')}"`}
        onClick={() => {
          const path = sourcePath();
          const doc = s.doc?.value;
          if (path) doc?.change((d) => Obj.Path.Mutate.delete(d, path));
        }}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `diagnostics: ${p.diagnostics.value}`}
        onClick={() => Signal.cycle(p.diagnostics, [D.diagnostics, 'none'])}
      />
      <Button
        block
        label={() => `(reset → reload)`}
        onClick={() => {
          debug.reset();
          window.location.reload();
        }}
      />

      <ObjectView name={'debug'} data={safeProps(debug)} expand={0} style={{ marginTop: 15 }} />
      <YamlObjectView
        style={{ marginTop: 5 }}
        bus$={debug.bus$}
        doc={s.doc?.value}
        editor={s.editor?.value}
      />
    </div>
  );
};

/**
 * Helpers:
 */
function safeProps(debug: DebugSignals) {
  const p = { ...debug.props };
  delete (p as any).doc;
  return Signal.toObject(p);
}
