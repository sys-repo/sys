import React from 'react';
import { type t, css, D, MonacoEditor, Signal, EditorPrompt } from './common.ts';

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
  const bindingRef = React.useRef<t.EditorPrompt.Binding | undefined>(undefined);
  const mountIdRef = React.useRef(0);
  const height = v.height ?? D.lineCount * D.fallbackLineHeight;

  const updateState = (state: t.EditorPrompt.State) => {
    p.lineCount.value = state.lineCount;
    p.visibleLines.value = state.visibleLines;
    p.scrolling.value = state.scrolling;
    p.height.value = state.height;
  };

  return (
    <MonacoEditor
      style={css({ height }, props.style)}
      theme={v.theme}
      onMounted={(e: t.MonacoEditorReady) => {
        const mountId = ++mountIdRef.current;
        p.editor.value = e.editor;
        void EditorPrompt.bind({
          editor: e.editor,
          monaco: e.monaco,
          onStateChange: updateState,
        }).then((binding) => {
          if (mountId !== mountIdRef.current) return binding.dispose();
          bindingRef.current?.dispose();
          bindingRef.current = binding;
          updateState(binding.state);
        });
      }}
      onDispose={() => {
        mountIdRef.current++;
        bindingRef.current?.dispose();
        bindingRef.current = undefined;
        p.editor.value = undefined;
        p.lineCount.value = D.lineCount;
        p.visibleLines.value = D.lineCount;
        p.scrolling.value = false;
        p.height.value = D.lineCount * D.fallbackLineHeight;
      }}
      onChange={(e: t.MonacoEditorChange) => {
        p.text.value = e.content.text;
      }}
    />
  );
};
