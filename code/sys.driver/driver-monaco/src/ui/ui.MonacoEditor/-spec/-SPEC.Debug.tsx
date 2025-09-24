import React from 'react';

import {
  type t,
  Button,
  css,
  D,
  Is,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  Util,
} from '../common.ts';
import { SAMPLE_CODE } from './-SPEC.u.code.ts';
import { LanguagesList } from './-ui.ts';

type P = t.MonacoEditorProps;
type Storage = Pick<
  P,
  | 'theme'
  | 'debug'
  | 'enabled'
  | 'readOnly'
  | 'minimap'
  | 'tabSize'
  | 'wordWrap'
  | 'language'
  | 'placeholder'
  | 'autoFocus'
  | 'fontSize'
  | 'spinning'
> & { render?: boolean };

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
const defaults: Storage = {
  render: true,
  debug: false,
  theme: 'Dark',
  enabled: D.props.enabled,
  readOnly: D.props.readOnly,
  autoFocus: true,
  minimap: D.props.minimap,
  tabSize: D.props.tabSize,
  wordWrap: D.props.wordWrap,
  language: D.props.language,
  spinning: D.props.spinning,
  fontSize: undefined,
  placeholder: undefined,
};

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
    render: s(snap.render),

    enabled: s(snap.enabled),
    readOnly: s(snap.readOnly),
    fontSize: s(snap.fontSize),
    autoFocus: s(snap.autoFocus),
    minimap: s(snap.minimap),
    tabSize: s(snap.tabSize),
    wordWrap: s(snap.wordWrap),
    language: s(snap.language),
    placeholder: s(snap.placeholder),
    spinning: s(snap.spinning),

    defaultValue: s<P['defaultValue']>(),
    editor: s<t.Monaco.Editor>(),
    selectedPath: s<t.ObjectPath>([]),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.render = p.render.value;
      d.enabled = p.enabled.value;
      d.readOnly = p.readOnly.value;
      d.fontSize = p.fontSize.value;
      d.minimap = p.minimap.value;
      d.autoFocus = p.autoFocus.value;
      d.tabSize = p.tabSize.value;
      d.wordWrap = p.wordWrap.value;
      d.language = p.language.value;
      d.placeholder = p.placeholder.value;
      d.spinning = p.spinning.value;
    });
  });

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
    p.selectedPath.value = [];
  }

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
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `spinning: ${p.spinning.value ?? `<undefined>)`}`}
        onClick={() => Signal.toggle(p.spinning)}
      />
      <Button
        block
        label={() => `placeholder: ${p.placeholder.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.placeholder, ['my placeholder', undefined])}
      />

      <hr />
      <Button
        block
        label={() => {
          const v = p.fontSize.value;
          const d = D.props.fontSize;
          return `fontSize: ${v ? `${v}px` : `(default: ${d}px)`}`;
        }}
        onClick={() => Signal.cycle<P['fontSize']>(p.fontSize, [12, undefined, 16, 18, 22, 36])}
      />
      <Button
        block
        label={() => `enabled: ${p.enabled.value}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => `readOnly: ${p.readOnly.value}`}
        onClick={() => Signal.toggle(p.readOnly)}
      />
      <Button
        block
        label={() => `autoFocus: ${p.autoFocus.value}`}
        onClick={() => Signal.toggle(p.autoFocus)}
      />
      <Button
        block
        label={() => `autoFocus: (increment number)`}
        onClick={() => {
          if (Is.bool(p.autoFocus.value)) p.autoFocus.value = -1;
          (p.autoFocus.value as number) += 1;
        }}
      />
      <Button
        block
        label={() => `minimap: ${p.minimap.value}`}
        onClick={() => Signal.toggle(p.minimap)}
      />
      <Button
        block
        label={() => `tabSize: ${p.tabSize.value ?? `<undefined> (default: ${D.props.tabSize})`}`}
        onClick={() => Signal.cycle(p.tabSize, [2, 4, undefined])}
      />
      <Button
        block
        label={() =>
          `wordWrap: ${p.wordWrap.value ?? `<undefined> (default: ${D.props.wordWrap})`}`
        }
        onClick={() => Signal.toggle(p.wordWrap)}
      />

      <hr />
      <div className={Styles.title.class}>{'Languages:'}</div>
      <LanguagesList
        style={{ marginLeft: 15, marginBottom: 20 }}
        current={p.language.value}
        onSelect={(e) => {
          const sample = SAMPLE_CODE[e.language];
          const format = (code: string) => {
            code = code.replace(/^\s*\n|\n\s*$/g, '');
            return `${code}\n`;
          };
          if (sample) p.defaultValue.value = format(sample);
          p.language.value = e.language;
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
        label={() => `render: ${p.render.value}`}
        onClick={() => Signal.toggle(p.render)}
      />

      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView
        name={'debug'}
        data={wrangle.debug(debug)}
        expand={['$']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

/**
 * Helpers:
 */

/**
 * Helpers:
 */
const wrangle = {
  debug(debug: DebugSignals) {
    const p = debug.props;
    const editor = p.editor.value;
    const textModel = editor?.getModel();
    const text = textModel?.getValue() ?? '';

    const props = Signal.toObject(p);
    delete props.editor;

    const data = {
      props,
      editor: !editor
        ? undefined
        : {
            'id.instance': editor?.getId(),
            'css.class': Util.Editor.className(editor),
            text: `chars:(${text.length}), lines:(${text.split('\n').length})`,
          },
    };

    return Signal.toObject(data);
  },
} as const;
