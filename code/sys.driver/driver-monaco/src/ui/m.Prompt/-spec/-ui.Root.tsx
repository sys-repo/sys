import React from 'react';
import { type t, css, MonacoEditor, Signal, EditorPrompt } from './common.ts';

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
  const style = v.promptState?.height === undefined ? props.style : css({ height: v.promptState.height }, props.style);

  const updateState = (state: t.EditorPrompt.State) => {
    p.promptState.value = state;
  };

  return (
    <MonacoEditor
      style={style}
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
        p.promptState.value = undefined;
      }}
      onChange={(e: t.MonacoEditorChange) => {
        p.text.value = e.content.text;
      }}
    />
  );
};
