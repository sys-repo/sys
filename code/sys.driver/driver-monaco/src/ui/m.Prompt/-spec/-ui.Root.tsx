import React from 'react';
import { type t, css, D, EditorPrompt, MonacoEditor, Rx, Signal } from './common.ts';

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
  const { height } = useBindingSample(debug);

  /**
   * Render:
   */
  return (
    <MonacoEditor
      style={css({ height }, props.style)}
      theme={v.theme}
      language={'plaintext'}
      autoFocus={true}
      onMounted={(e) => {
        p.editor.value = e.editor;
      }}
      onChange={(e) => {
        p.text.value = e.content.text;
      }}
      onDispose={() => {
        p.editor.value = undefined;
        p.state.value = undefined;
      }}
    />
  );
};

/**
 * Binding orchestration
 */
function useBindingSample(debug: t.DebugSignals) {
  const p = debug.props;
  const v = Signal.toObject(p);

  const bindingRef = React.useRef<t.EditorPrompt.Binding>(undefined);
  const lineHeight = 21;
  const [height, setHeight] = React.useState(lineHeight);

  React.useEffect(() => {
    if (!v.editor) return;

    const life = Rx.lifecycle();
    const editor: t.Monaco.Editor = v.editor;

    async function run() {
      bindingRef.current?.dispose();
      bindingRef.current = undefined;

      const updateHeight = (state: t.EditorPrompt.State) => setHeight(state.height);

      const config: t.EditorPrompt.Config = {
        lines: { min: 1, max: v.maxLines ?? D.lines.max },
        overflow: v.overflow,
        submitOn: 'enter:modified',
      };

      const binding = await EditorPrompt.bind(
        {
          editor,
          lineHeight,
          config,
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
      bindingRef.current = undefined;
    };
  }, [v.editor, v.maxLines, v.overflow]);

  return { height } as const;
}
