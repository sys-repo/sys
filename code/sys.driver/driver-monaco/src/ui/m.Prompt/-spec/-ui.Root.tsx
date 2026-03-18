import React from 'react';
import { type t, css, D, EditorPrompt, MonacoEditor, Rx, Signal } from './common.ts';

const OWNERS = ['subject', 'footer'] as const;
export type OwnerKind = (typeof OWNERS)[number];

export type RootProps = {
  owner: OwnerKind;
  debug: t.DebugSignals;
  autoFocus?: boolean;
  contentInset?: t.MonacoEditorContentInset;
  borderTop?: t.CssProps['borderTop'];
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onKeyDown?: t.MonacoEditorKeyDownHandler;
};

/**
 * Component:
 */
export const Root: React.FC<RootProps> = (props) => {
  const { debug } = props;
  Signal.useRedrawEffect(() => debug.listen());
  const p = debug.props;
  const v = Signal.toObject(p);
  const channel = props.owner;
  const defaultValue = wrangle.text(v, channel);
  const { height } = useBindingSample(props);

  /**
   * Render:
   */
  const styles = {
    base: css({
      display: 'grid',
      borderTop: props.borderTop,
    }),
  };

  return (
    <div className={styles.base.class}>
      <MonacoEditor
        style={css({ height }, props.style)}
        theme={props.theme ?? v.theme}
        language={'plaintext'}
        defaultValue={defaultValue}
        autoFocus={props.autoFocus}
        contentInset={props.contentInset}
        onKeyDown={props.onKeyDown}
        onMounted={(e) => wrangle.setEditor(p, channel, e.editor)}
        onChange={(e) => wrangle.setText(p, channel, e.content.text)}
        onDispose={() => {
          wrangle.setEditor(p, channel, undefined);
          wrangle.setState(p, channel, undefined);
        }}
      />
    </div>
  );
};

/**
 * Binding orchestration
 */
function useBindingSample(props: RootProps) {
  const { owner, debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  const channel = owner;
  const insetTop = props.contentInset?.top ?? 0;
  const insetBottom = props.contentInset?.bottom ?? 0;
  const insetY = insetTop + insetBottom;
  const bindingRef = React.useRef<t.EditorPrompt.Binding>(undefined);
  const lineHeight = 21;
  const [height, setHeight] = React.useState(lineHeight + insetY);

  React.useEffect(() => {
    const editor = wrangle.editor(v, channel);
    if (!editor) return;

    const life = Rx.lifecycle();
    const mountedEditor: t.Monaco.Editor = editor;

    async function run() {
      bindingRef.current?.dispose();
      bindingRef.current = undefined;

      const updateHeight = (state: t.EditorPrompt.State) => setHeight(state.height + insetY);

      const config: t.EditorPrompt.Config = {
        lines: { min: 1, max: v.maxLines ?? D.lines.max },
        overflow: v.overflow,
        submitOn: 'enter:modified',
      };

      const binding = await EditorPrompt.bind(
        {
          editor: mountedEditor,
          lineHeight,
          config,
          onStateChange(state) {
            wrangle.setState(p, channel, state);
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
      wrangle.setState(p, channel, binding.state);
      updateHeight(binding.state);
    }

    void run();
    return () => {
      life.dispose();
      bindingRef.current = undefined;
    };
  }, [channel, v.editorSubject, v.editorFooter, v.maxLines, v.overflow, insetY]);

  return { height } as const;
}

const wrangle = {
  editor(v: ReturnType<typeof Signal.toObject<t.DebugSignals['props']>>, channel: OwnerKind) {
    if (channel === 'subject') return v.editorSubject;
    return v.editorFooter;
  },

  text(v: ReturnType<typeof Signal.toObject<t.DebugSignals['props']>>, channel: OwnerKind) {
    if (channel === 'subject') return v.textSubject;
    return v.textFooter;
  },

  setEditor(p: t.DebugSignals['props'], channel: OwnerKind, editor: t.Monaco.Editor | undefined) {
    if (channel === 'subject') p.editorSubject.value = editor;
    if (channel === 'footer') p.editorFooter.value = editor;
  },

  setText(p: t.DebugSignals['props'], channel: OwnerKind, text: string) {
    if (channel === 'subject') p.textSubject.value = text;
    if (channel === 'footer') p.textFooter.value = text;
  },

  setState(
    p: t.DebugSignals['props'],
    channel: OwnerKind,
    state: t.EditorPrompt.State | undefined,
  ) {
    if (channel === 'subject') p.stateSubject.value = state;
    if (channel === 'footer') p.stateFooter.value = state;
  },
} as const;
