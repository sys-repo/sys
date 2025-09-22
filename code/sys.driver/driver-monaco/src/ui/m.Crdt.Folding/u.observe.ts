import { type t, rx } from './common.ts';
import { getHiddenAreas } from './u.hidden.ts';
import { equalRanges } from './u.ts';

export const observe: t.EditorFoldingLib['observe'] = (ed, until) => {
  const editor = ed as t.Monaco.Editor;

  // Lifecycle:
  const life = rx.lifecycle(until);
  life.dispose$.subscribe(() => sub.dispose());

  const toSE = (r: t.Monaco.I.IRange) => ({
    start: r.startLineNumber,
    end: r.endLineNumber,
  });

  /**
   * Internal subject → raw change notifications.
   */
  const $$ = rx.subject<t.EditorFoldingAreaChange>();

  /**
   * Public ∂ stream:
   *  - auditTime(0)              ← coalesce bursty events (same-tick).
   *  - distinctUntilChanged      ← drop dup payloads.
   *  - takeUntil(life.dispose$)  ← auto-complete on teardown.
   */
  const $ = $$.pipe(
    rx.auditTime(0),
    rx.throttleTime(0, undefined, { leading: true, trailing: true }), // ← keep first + last.
    rx.distinctUntilChanged((p, q) => equalRanges(p.areas.map(toSE), q.areas.map(toSE))),
    rx.takeUntil(life.dispose$),
  );

  /**
   * Methods/State:
   */
  const snap = () => getHiddenAreas(editor);
  let areas: t.Monaco.I.IRange[] = snap();

  /**
   * Event listeners:
   */
  const sub = editor.onDidChangeHiddenAreas(() => {
    areas = snap();
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
