import { type t, rx } from './common.ts';

export const observe: t.EditorHiddenLib['observe'] = (ed, until) => {
  const editor = ed as t.Monaco.Editor & t.EditorHiddenMembers;

  // Lifecycle:
  const life = rx.lifecycle(until);
  life.dispose$.subscribe(() => sub.dispose());

  const $$ = rx.subject<t.EditorHiddenAreaChange>();
  const $ = $$.pipe(rx.takeUntil(life.dispose$));

  /**
   * Methods/State:
   */
  const get = (): t.Monaco.IRange[] => editor.getHiddenAreas?.() ?? [];
  let areas: t.Monaco.IRange[] = get();

  /**
   * Event listeners:
   */
  const sub = editor.onDidChangeHiddenAreas(() => {
    areas = get();
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
