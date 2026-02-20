import React from 'react';
import { type t, css, EditorPrompt, MonacoEditor, Rx, Signal, D } from './common.ts';

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

  /**
   * State:
   */
  const lineHeight = 21;
  const [height, setHeight] = React.useState(lineHeight);

  /**
   * Effects:
   */
  React.useEffect(() => {
    const editor = p.editor.value;
    if (!editor) return;

    const life = Rx.lifecycle();

    async function run() {
      bindingRef.current?.dispose();
      bindingRef.current = undefined;

      const updateHeight = (state: t.EditorPrompt.State) => setHeight(state.height);
      const binding = await EditorPrompt.bind(
        {
          editor: editor!,
          lineHeight,
          config: {
            lines: { min: 1, max: v.maxLines ?? D.lines.max },
            overflow: v.overflow,
            submitOn: 'enter:modified',
          },
          onStateChange(state) {
            p.state.value = state;
            updateHeight(state);
          },
          onSubmit(e) {
            console.info(`⚡️ onSubmit`, e);
          },
        },
        life,
      );

      if (life.disposed) return;

      bindingRef.current = binding;
      p.state.value = binding.state;
      updateHeight(binding.state);
    }

    void run();

    return () => {
      life.dispose();
      bindingRef.current?.dispose();
      bindingRef.current = undefined;
    };
  }, [p.editor.value, v.overflow]);

  /**
   * Render:
   */
  return (
    <MonacoEditor
      style={css({ height }, props.style)}
      language={'plaintext'}
      theme={v.theme}
      autoFocus={true}
      onMounted={(e: t.MonacoEditorReady) => {
        p.editor.value = e.editor;
      }}
      onDispose={() => {
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
