import { type t, Yaml, rx } from './common.ts';

export const observePath: t.EditorYamlLib['observePath'] = (editor, until) => {
  const model = editor.getModel();
  if (!model) throw new Error('Editor has no model');

  // Lifecycle:
  const life = rx.lifecycle(until);
  life.dispose$.subscribe(() => {
    cursorSub.dispose();
    langSub.dispose();
  });

  const $$ = rx.subject<t.EditorYamlPathObserverEvent>();
  const $ = $$.pipe(rx.takeUntil(life.dispose$));

  // Keep the latest parse and the model version it belongs to.
  let doc = Yaml.parseDocument(model.getValue());
  let version = model.getVersionId();
  let path: t.ObjectPath = [];

  // (Re)parse helper.
  const parse = () => {
    doc = Yaml.parseDocument(model.getValue());
    version = model.getVersionId();
  };

  // Update when the buffer changes.
  model.onDidChangeContent(parse);

  const clear = () => {
    path = [];
    $$.next({ path, cursor: nullCursor() });
  };

  const update = () => {
    const info = wrangle.info(editor);
    if (info && info.language === 'yaml') {
      const { position, offset } = info;
      path = Yaml.pathAtOffset(doc.contents, offset);
      $$.next({ path, cursor: { position, offset } });
    } else {
      clear();
    }
  };

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

  /**
   * API:
   */
  return rx.toLifecycle<t.EditorYamlPathObserver>(life, {
    get $() {
      return $;
    },
    get path() {
      return path;
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
    const offset = position ? model?.getOffsetAt(position) ?? -1 : -1;
    return { position, offset, language };
  },
} as const;

const nullCursor = (): t.EditorYamlPathObserverEvent['cursor'] => {
  return {
    offset: -1,
    position: { lineNumber: -1, column: -1 },
  };
};
