import React from 'react';
import { type t, css, MonacoEditor, Signal } from './common.ts';

export type RootProps = {
  debug: t.DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Root: React.FC<RootProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);

  /**
   * TODO 🐷
   * - Wire `EditorPrompt.bind` into the harness lifecycle.
   * - Replace bootstrap `minHeight` with controller-derived height.
   */
  const minHeight = 21;

  return (
    <MonacoEditor
      style={css({ minHeight }, props.style)}
      theme={v.theme}
      onMounted={(e: t.MonacoEditorReady) => {
        p.editor.value = e.editor;
      }}
      onDispose={() => {
        p.editor.value = undefined;
        p.promptState.value = undefined;
      }}
      onChange={(e: t.MonacoEditorChange) => {
        p.text.value = e.content.text;
      }}
    />
  );
};
