import { type t, rx, Obj } from './common.ts';

export const bind: t.EditorCrdtLib['bind'] = (monaco, doc, path, options = {}) => {
  const life = rx.lifecycle();
  const model = wrangle.model(monaco);

  doc.change((d) => {
    Obj.Path.Mutate.ensure(d, path, '');
  });

  console.log('model', model);

  /**
   * API:
   */
  return rx.toLifecycle<t.EditorCrdtBinding>(life, {
    doc,
    path,
  });
};

/**
 * Helpers:
 */
const wrangle = {
  model(input: t.MonacoTextModel | t.MonacoCodeEditor): t.MonacoTextModel {
    if (typeof (input as any).getModel === 'function') (input as t.MonacoCodeEditor).getModel();
    return input as t.MonacoTextModel;
  },
} as const;
