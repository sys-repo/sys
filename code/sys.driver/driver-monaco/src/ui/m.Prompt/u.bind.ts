import { type t, Rx, Util } from './common.ts';
import { normalize } from './u.normalize.ts';
import { state as calculateState } from './u.state.ts';

export const bind: t.EditorPrompt.BindPrompt = async (args, until) => {
  const { lineHeight } = args;
  const life = Rx.lifecycle(until);
  const config = normalize(args.config);
  const editor = args.editor;

  let model = editor.getModel() ?? undefined;
  if (!model) model = await Util.Editor.waitForModel(editor, life);
  if (!model) throw new Error('A model could not be retrieved from the editor.');

  let current = calculateState({
    config,
    lineHeight,
    lineCount: model.getLineCount(),
  });

  const recompute = () => {
    current = calculateState({
      config,
      lineHeight,
      lineCount: model.getLineCount(),
    });
    wrangle.applyOptions(editor, current);
    args.onStateChange?.(current);
    return current;
  };

  const contentSub = model.onDidChangeContent(() => {
    if (life.disposed) return;
    recompute();
  });

  life.dispose$.subscribe(() => contentSub.dispose());
  recompute(); // Prime first state emission.

  return Rx.toLifecycle<t.EditorPrompt.Binding>(life, {
    config,
    model,
    get state() {
      return current;
    },
    recompute,
  });
};

const wrangle = {
  applyOptions(editor: t.Monaco.Editor, state: t.EditorPrompt.State) {
    const updateOptions = (editor as unknown as { updateOptions?: (options: unknown) => void })
      .updateOptions;
    if (!updateOptions) return;

    updateOptions({
      minimap: { enabled: false },
      lineNumbers: 'off',
      scrollBeyondLastLine: false,
      scrollbar: {
        vertical: state.scrolling ? 'visible' : 'hidden',
        horizontal: 'hidden',
        useShadows: false,
      },
    });
  },
} as const;
