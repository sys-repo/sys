import { type t, Yaml } from '../common.ts';

export function tmp(editor: t.Monaco.Editor) {
  observeYamlPath(editor, (path) => {
    console.log('current YAML path →', path);
  });
}

/**
 * Wire everything to an editor instance.
 * Re-parse on buffer edits; emit path on every cursor move.
 */
export const observeYamlPath = (editor: t.Monaco.Editor, onPath: (p: t.ObjectPath) => void) => {
  const model = editor.getModel();
  if (!model) throw new Error('Editor has no model');

  // Includes: ranges, comments, errors.
  let doc = Yaml.parseDocument(model.getValue());

  // Re-parse when the buffer changes (debounce/throttle if needed):
  model.onDidChangeContent(() => {
    doc = Yaml.parseDocument(model.getValue());
  });

  // Watch the caret:
  editor.onDidChangeCursorPosition((e) => {
    const offset = model.getOffsetAt(e.position); // Monaco helper.
    const path = Yaml.pathAtOffset(doc.contents, offset);
    onPath(path);
  });
};
