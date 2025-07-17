import { type t, Yaml, rx } from './common.ts';

export const trackPath: t.EditorYamlLib['trackPath'] = (editor, until) => {
  const model = editor.getModel();
  if (!model) throw new Error('Editor has no model');

  // Lifecycle:
  const life = rx.lifecycle(until);
  life.dispose$.subscribe(() => sub.dispose());

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

  /**
   * Handler: Watch the caret moving.
   */
  const sub = editor.onDidChangeCursorPosition((e) => {
    // If the buffer changed *after* our last parse, refresh first.
    if (model.getVersionId() !== version) parse();

    const position = e.position;
    const offset = model.getOffsetAt(position); // Monaco helper.
    path = Yaml.pathAtOffset(doc.contents, offset);
    $$.next({ path, cursor: { position, offset } });
  });

  /**
   * API:
   */
  return rx.toLifecycle<t.EditorYamlPathObserver>(life, {
    $,
    get path() {
      return path;
    },
  });
};
