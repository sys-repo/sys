import { type t, rx } from './common.ts';
import { calcHiddenRanges } from './u.ts';

export const observe: t.EditorFoldingLib['observe'] = (ed, until) => {
  const editor = ed as t.Monaco.Editor;

  // Lifecycle:
  const life = rx.lifecycle(until);
  life.dispose$.subscribe(() => sub.dispose());

  const $$ = rx.subject<t.EditorFoldingAreaChange>();
  const $ = $$.pipe(rx.takeUntil(life.dispose$));

  /**
   * Methods/State:
   */
  const current = () => calcHiddenRanges(editor);
  let areas: t.Monaco.I.IRange[] = current();

  /**
   * Event listeners:
   */
  const sub = editor.onDidChangeHiddenAreas(() => {
    areas = current();
    $$.next({ areas });
  });

  /**
   * API:
   */
  return rx.toLifecycle<t.EditorFoldingAreaObserver>(life, {
    get $() {
      return $;
    },
    get areas() {
      return areas;
    },
  });
};
