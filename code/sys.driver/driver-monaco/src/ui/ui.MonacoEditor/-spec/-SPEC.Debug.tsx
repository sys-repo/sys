import React from 'react';
import { Monaco } from '../../../mod.ts';

import { type t, Button, Color, css, D, ObjectView, Signal, Wrangle } from '../common.ts';
import { SAMPLE_CODE } from './-SPEC.u.code.ts';

type P = t.MonacoEditorProps;

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
  const props = {
    debug: s(false),
    render: s(true),
    editor: s<t.MonacoCodeEditor>(),
    carets: s<t.EditorCarets>(),

    theme: s<P['theme']>('Dark'),
    enabled: s<P['enabled']>(D.props.enabled),
    readOnly: s<P['readOnly']>(D.props.readOnly),
    minimap: s<P['minimap']>(D.props.minimap),
    tabSize: s<P['tabSize']>(D.props.tabSize),

    language: s<P['language']>(),
    text: s<P['text']>(),
    placeholder: s<P['placeholder']>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.render.value;
      p.editor.value;
      p.carets.value;
      p.theme.value;
      p.enabled.value;
      p.readOnly.value;
      p.minimap.value;
      p.tabSize.value;
      p.placeholder.value;
      p.text.value;
      p.language.value;
    },
  };
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
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `render: ${p.render.value}`}
        onClick={() => Signal.toggle(p.render)}
      />
      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
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
        label={() => `placeholder: ${p.placeholder.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.placeholder, ['my placeholder', undefined])}
      />
      <hr />
      {languageButtons(debug)}

      <hr />
      {caretButtons(debug)}

      <hr />
      <ObjectView name={'debug'} data={wrangle.debug(debug)} expand={['$']} />
    </div>
  );
};

/**
 * Dev Buttons:
 */
export function languageButtons(debug: DebugSignals) {
  const p = debug.props;
  const format = (code: string) => {
    code = code.replace(/^\s*\n|\n\s*$/g, '');
    return `${code}\n`;
  };
  const language = (language: t.EditorLanguage, codeSample?: string) => {
    const isCurrent = language === (p.language.value ?? D.props.language);
    return (
      <div className={styles.row.class}>
        <Button
          block
          label={() => language}
          onClick={() => {
            p.language.value = language;
            if (codeSample) p.text.value = format(codeSample);
          }}
        />
        <div>{isCurrent ? '🌳' : ''}</div>
      </div>
    );
  };

  const theme = Color.theme();
  const styles = {
    body: css({ marginLeft: 15 }),
    row: css({ display: 'grid', gridTemplateColumns: '1fr auto' }),
    hr: css({
      borderTop: `dashed 1px ${Color.alpha(theme.fg, 0.3)}`,
      height: 1,
      MarginY: 5,
    }),
  };
  const hr = () => <div className={styles.hr.class} />;

  return (
    <React.Fragment>
      <div className={Styles.title.class}>{'Language:'}</div>
      <div className={styles.body.class}>
        {language('typescript', SAMPLE_CODE.typescript)}
        {language('javascript', SAMPLE_CODE.javascript)}
        {hr()}
        {language('rust', SAMPLE_CODE.rust)}
        {language('go', SAMPLE_CODE.go)}
        {language('python', SAMPLE_CODE.python)}
        {hr()}
        {language('json', SAMPLE_CODE.json)}
        {language('yaml', SAMPLE_CODE.yaml)}
        {hr()}
        {language('markdown', SAMPLE_CODE.markdown)}
      </div>
    </React.Fragment>
  );
}

export function caretButtons(debug: DebugSignals) {
  const p = debug.props;
  const carets = p.carets.value;
  if (!carets) return null;

  const getCaret = () => carets.identity('foo.bar');
  const changeSelection = (label: string, selection: t.EditorRangesInput) => {
    return (
      <Button
        block
        label={() => label}
        onClick={() => getCaret().change({ selections: selection })}
      />
    );
  };

  const theme = Color.theme();
  const styles = {
    body: css({ marginLeft: 15 }),
    row: css({ display: 'grid', gridTemplateColumns: '1fr auto' }),
    hr: css({
      borderTop: `dashed 1px ${Color.alpha(theme.fg, 0.3)}`,
      height: 1,
      MarginY: 5,
    }),
  };
  const hr = () => <div className={styles.hr.class} />;

  const color = (color: string) => {
    return (
      <Button
        //
        block
        label={() => `color: ${color}`}
        onClick={() => getCaret().change({ color })}
      />
    );
  };

  return (
    <React.Fragment>
      <div className={Styles.title.class}>{'Carets'}</div>
      <div className={styles.body.class}>
        {changeSelection('selection: [ ]', [])}
        {hr()}
        {changeSelection('selection: [1, 3]', [1, 3])}
        {changeSelection('selection: [1, 5]', [1, 5])}
        {changeSelection('selection: {EditorRange}', {
          startLineNumber: 1,
          startColumn: 5,
          endLineNumber: 2,
          endColumn: 2,
        })}
        {hr()}

        {changeSelection('selection: [1, 5], [2, 2]', [
          [1, 5],
          [2, 2],
        ])}
        {changeSelection('selection: {EditorRange}, {EditorRange}', [
          {
            startLineNumber: 1,
            startColumn: 5,
            endLineNumber: 2,
            endColumn: 2,
          },
          {
            startLineNumber: 3,
            startColumn: 1,
            endLineNumber: 3,
            endColumn: 3,
          },
        ])}

        {hr()}
        {color('red')}
        {color('blue')}
        <Button
          block
          label={() => 'color: <next>'}
          onClick={() => getCaret().change({ color: Monaco.Carets.Color.next() })}
        />

        {hr()}
        <Button
          block
          label={() => 'clear (dispose all)'}
          onClick={() => carets.current.forEach((c) => c.dispose())}
        />
      </div>
    </React.Fragment>
  );
}

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
    delete props.carets;

    const data = {
      props,
      editor: !editor
        ? undefined
        : {
            'id.instance': editor?.getId(),
            'css.class': Wrangle.Editor.className(editor),
            text: `chars:(${text.length}), lines:(${text.split('\n').length})`,
          },
    };

    return Signal.toObject(data);
  },
} as const;
