import React from 'react';
import { type t, css, EditorPrompt, MonacoEditor, Signal } from './common.ts';

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

  const bindingRef = React.useRef<t.EditorPrompt.Binding>(undefined);
  const mountIdRef = React.useRef(0);
  const lineHeight = 21;

  return (
    <MonacoEditor
      style={css({ minHeight: lineHeight }, props.style)}
      theme={v.theme}
      onMounted={async (e: t.MonacoEditorReady) => {
        const { editor, dispose$ } = e;
        const mountId = ++mountIdRef.current;
        p.editor.value = e.editor;

        const binding = await EditorPrompt.bind(
          {
            editor: e.editor,
            lineHeight,
            config: {
              lines: { min: 1, max: 5 },
              overflow: 'scroll',
              enter: { onEnter: 'submit', onModifiedEnter: 'newline' },
              // enter: { onEnter: 'submit', onModifiedEnter: 'newline' },
            },
            onStateChange: (state) => {
              p.state.value = state;
            },
            onSubmit: (e) => {
              console.info(`⚡️ onSubmit`, e);
            },
          },
          dispose$,
        );

        if (mountId !== mountIdRef.current) {
          binding.dispose();
          return;
        }

        bindingRef.current?.dispose();
        bindingRef.current = binding;
        p.state.value = binding.state;
      }}
      onDispose={() => {
        mountIdRef.current++;
        bindingRef.current?.dispose();
        bindingRef.current = undefined;
        p.editor.value = undefined;
        p.state.value = undefined;
      }}
      onChange={(e: t.MonacoEditorChange) => {
        p.text.value = e.content.text;
      }}
    />
  );
};
