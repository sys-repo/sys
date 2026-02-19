import { type t, Rx, Util } from './common.ts';
import { toEnterKeyEvent } from './u.keyboard.ts';
import { normalize } from './u.normalize.ts';
import { resolveEnterAction, state as calculateState } from './u.state.ts';

export const bind: t.EditorPrompt.BindPrompt = async (args, until) => {
  const life = Rx.lifecycle(until);
  const config = normalize(args.config);
  const editor = args.editor;
  const lineHeight = args.lineHeight;

  let nextModel = editor.getModel() ?? undefined;
  if (!nextModel) nextModel = await Util.Editor.waitForModel(editor, life);
  if (!nextModel) throw new Error('A model could not be retrieved from the editor.');
  let model: t.Monaco.TextModel = nextModel;
  let current = calculateState({
    config,
    lineHeight,
    lineCount: model.getLineCount(),
  });

  const recompute: t.EditorPrompt.Binding['recompute'] = () => {
    current = calculateState({
      config,
      lineHeight,
      lineCount: model.getLineCount(),
    });
    wrangle.applyOptions(editor, current);
    args.onStateChange?.(current);
    return current;
  };

  let contentSub: t.Monaco.I.IDisposable | undefined;
  const rebind = (next: t.Monaco.TextModel) => {
    contentSub?.dispose();
    model = next;
    contentSub = model.onDidChangeContent(() => {
      if (life.disposed) return;
      recompute();
    });
    recompute();
  };

  const modelSub = editor.onDidChangeModel(() => {
    if (life.disposed) return;
    const next = editor.getModel() ?? undefined;
    if (!next) return;
    rebind(next);
  });

  const keySub = wrangle.onKeyDown(editor, (event) => {
    if (life.disposed) return;
    const key = toEnterKeyEvent(event);
    if (!key) return;

    const action = resolveEnterAction({ config, modifiers: key.modifiers });
    if (action === 'submit') {
      key.preventDefault();
      key.stopPropagation();
      args.onSubmit?.({ editor, model, text: model.getValue(), modifiers: key.modifiers });
      return;
    }

    if (config.overflow === 'clamp' && model.getLineCount() >= config.lines.max) {
      key.preventDefault();
      key.stopPropagation();
    }
  });

  life.dispose$.subscribe(() => {
    contentSub?.dispose();
    modelSub.dispose();
    keySub?.dispose();
  });
  rebind(model);

  return Rx.toLifecycle<t.EditorPrompt.Binding>(life, {
    config,
    get model() {
      return model;
    },
    get state() {
      return current;
    },
    recompute,
  });
};

const wrangle = {
  onKeyDown(
    editor: t.Monaco.Editor,
    listener: (e: t.Monaco.I.IKeyboardEvent) => void,
  ) {
    return editor.onKeyDown(listener);
  },

  applyOptions(editor: t.Monaco.Editor, state: t.EditorPrompt.State) {
    editor.updateOptions({
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
