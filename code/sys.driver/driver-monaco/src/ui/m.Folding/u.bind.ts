import { type t, Bus, Rx, Util } from './common.ts';
import { impl } from './u.bind.impl.ts';

/**
 * Pure CRDT ⇄ Monaco fold-mark synchronizer (lifecycle-based, React-free).
 * Uses only Monaco public commands (fold/unfoldAll) to keep gutter + hidden areas in sync.
 */
export const bindFoldMarks: t.BindFoldMarks = (args) => {
  const { editor, doc, path, until, enabled = true } = args;
  const life = Rx.lifecycle(until);

  // Event bus (public stream: { kind: 'marks', ... }):
  const bus$ = args.bus$ ?? Bus.make();
  const $ = bus$.pipe(
    Rx.takeUntil(life.dispose$),
    Rx.filter((e) => e.kind === 'editor:marks'),
  );

  const api = Rx.toLifecycle<t.EditorFoldBinding>(life, { $ });
  if (!enabled || !editor || !doc || !path?.length) return api;

  // Bind to editor model
  const setup = (model: t.Monaco.TextModel) => impl({ bus$, model, editor, doc, path, life });
  Util.Editor.waitForModel(editor, life).then((model) => {
    if (!model || life.disposed) return;
    setup(model);
  });

  return api;
};
