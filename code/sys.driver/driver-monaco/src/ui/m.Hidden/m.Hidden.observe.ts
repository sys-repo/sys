import { type t, rx } from './common.ts';
import { calcHiddenRanges } from './u.ts';

export const observe: t.EditorHiddenLib['observe'] = (ed, until) => {
  const editor = ed as t.Monaco.Editor;

  // Lifecycle:
  const life = rx.lifecycle(until);
  life.dispose$.subscribe(() => sub.dispose());

  const $$ = rx.subject<t.EditorHiddenAreaChange>();
  const $ = $$.pipe(rx.takeUntil(life.dispose$));

  /**
   * Methods/State:
   */
  const current = () => calcHiddenRanges(editor);
  let areas: t.Monaco.IRange[] = current();

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
  return rx.toLifecycle<t.EditorHiddenAreaObserver>(life, {
    get $() {
      return $;
    },
    get areas() {
      return areas;
    },
  });
};
