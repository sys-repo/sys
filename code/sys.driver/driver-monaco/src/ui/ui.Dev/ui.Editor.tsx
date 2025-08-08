import React from 'react';
import { EditorCrdt } from '../m.Crdt/mod.ts';
import { EditorYaml } from '../m.Yaml/mod.ts';

import { type t, Color, css, D } from './common.ts';
import { Body } from './ui.Editor.Body.tsx';
import { Footer } from './ui.Footer.tsx';
import { NotReady } from './ui.NotReady.tsx';
import { useSignals } from './use.Signals.ts';

type P = t.DevEditorProps;

export const DevEditor: React.FC<P> = (props) => {
  const { debug = false, repo, path, footer = {} } = props;
  const footerVisible = footer.visible ?? D.footer.visible;

  /**
   * Hooks:
   */
  const { signals, doc, editor, monaco } = useSignals(props.signals);

  EditorCrdt.useBinding({ editor, doc, path, foldMarks: true }, (e) => {});

  const yaml = EditorYaml.useYaml({
    monaco,
    editor,
    doc,
    path,
    errorMarkers: true, // NB: display YAML parse errors inline in the code-editor.
  });

  let hasErrors = false;
  if (yaml.parsed.errors.length > 0) hasErrors = true;

  /**
   * Effects:
   */
  React.useEffect(() => {
    if (!doc) return;
    props.onDocumentChange?.({ doc });
  }, [doc?.id]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: '1fr auto',
    }),
  };

  const elNoRepo = !repo && <NotReady theme={theme.name} label={'No CRDT repository.'} />;
  const elNoPath = !path && <NotReady theme={theme.name} label={'No document path.'} />;
  const elError = elNoRepo || elNoPath;

  const elMain = elError || <Body {...props} signals={signals} />;
  const elFooter = footerVisible && <Footer theme={theme.name} yaml={yaml} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elMain}
      {elFooter}
    </div>
  );
};
