import { type t, Bus, Rx, Yaml } from './common.ts';
import { pathAtCaret } from './u.pathAtCaret.ts';

export const observe: t.EditorYamlPathLib['observe'] = (args, until) => {
  const { editor } = args;
  const model = editor.getModel();
  if (!model) throw new Error('Editor has no model');

  // Lifecycle:
  const life = Rx.lifecycle(until);
  const disposables: Array<{ dispose(): void }> = [];
  life.dispose$.subscribe(() => disposables.forEach((d) => d.dispose()));

  const bus$ = args.bus$ ?? Bus.make();
  const $ = bus$.pipe(
    Rx.takeUntil(life.dispose$),
    Rx.filter((e) => e.kind === 'editor:yaml:cursor'),
  );

  // Keep the latest parse and the model version it belongs to:
  let ast = Yaml.parseAst(model.getValue());
  let version = model.getVersionId();
  let current: t.EventYamlCursor | undefined;

  // (Re)parse helper:
  const parse = () => {
    ast = Yaml.parseAst(model.getValue());
    version = model.getVersionId();
  };

  const clear = () => {
    current = undefined;
    Bus.emit(bus$, 'micro', { kind: 'editor:yaml:cursor', path: [] });
  };

  const update = () => {
    const info = wrangle.info(editor);
    if (info?.language === 'yaml') {
      const { position } = info;
      const word = wrangle.wordRange(editor);
      const { offset, path } = pathAtCaret(model, ast, position);
      if (offset === -1) return void clear();

      current = { kind: 'editor:yaml:cursor', path, word, cursor: { position, offset } };
      Bus.emit(bus$, 'micro', current);
    } else {
      clear();
    }
  };

  /**
   * Handler: Update when the buffer changes.
   */
  const contentSub = model.onDidChangeContent(parse);

  /**
   * Handler: Watch the caret moving.
   */
  const cursorSub = editor.onDidChangeCursorPosition((e) => {
    // If the buffer changed after the last parse, refresh it first.
    if (model.getVersionId() !== version) parse();
    update();
  });

  /**
   * Handler: Only report on YAML language.
   */
  const langSub = model.onDidChangeLanguage((e) => {
    parse(); // ← Re-parse the buffer under the new language mode.
    update();
  });

  // Store refs for cleanup:
  disposables.push(contentSub);
  disposables.push(cursorSub);
  disposables.push(langSub);

  /**
   * API:
   */
  return Rx.toLifecycle<t.EditorYamlCursorPathObserver>(life, {
    get $() {
      return $;
    },
    get current() {
      type T = t.EventYamlCursor;
      return current ? current : ({ kind: 'editor:yaml:cursor', path: [] } satisfies T);
    },
  });
};

/**
 * Helpers:
 */
const wrangle = {
  info(editor: t.Monaco.Editor) {
    const position = editor.getPosition() || undefined;
    const model = editor.getModel();
    if (!position || !model) return;
    const language = model.getLanguageId() as t.EditorLanguage;
    const offset = position ? (model?.getOffsetAt(position) ?? -1) : -1;
    return { position, offset, language } as const;
  },

  wordRange(editor: t.Monaco.Editor): t.Monaco.I.IRange | undefined {
    const position = editor.getPosition();
    const model = editor.getModel();
    if (!position || !model) return;

    const word = model.getWordAtPosition(position);
    if (!word) return;

    return {
      startLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endLineNumber: position.lineNumber,
      endColumn: word.endColumn,
    };
  },
} as const;
