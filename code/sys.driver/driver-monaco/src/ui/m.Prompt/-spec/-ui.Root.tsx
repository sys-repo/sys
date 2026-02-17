import React from 'react';
import { type t, css, D, MonacoEditor, Signal, Num } from './common.ts';

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
  const height = (v.lineCount ?? D.lineCount) * 21;
  return (
    <MonacoEditor
      style={css({ height }, props.style)}
      theme={v.theme}
      onMounted={(e: t.MonacoEditorReady) => {
        p.editor.value = e.editor;
        p.lineCount.value = Num.clamp(1, Num.MAX_INT, e.editor.getModel()?.getLineCount() ?? 1);
      }}
      onDispose={() => {
        p.editor.value = undefined;
        p.lineCount.value = D.lineCount;
      }}
      onChange={(e: t.MonacoEditorChange) => {
        p.text.value = e.content.text;
        p.lineCount.value = Num.clamp(1, Num.MAX_INT, e.content.text.split('\n').length);
      }}
    />
  );
};
