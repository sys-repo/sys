import { rx, type t } from './common.ts';

type ChangeType = t.StoreIndexChangeEvent['type'];

/**
 * Factory for the Index events object.
 */
export function events(
  index: t.StoreIndex,
  options: { dispose$?: t.UntilObservable } = {},
): t.StoreIndexEvents {
  const life = rx.lifecycle(options.dispose$);
  const { dispose, dispose$ } = life;

  const $$ = rx.subject<t.StoreIndexEvent>();
  const $ = $$.pipe(rx.takeUntil(dispose$));
  const changed$ = rx.payload<t.DocChangedEvent<t.StoreIndexDoc>>($, 'crdt:doc/Changed');
  const doc = index.doc.events(dispose$);
  doc.$.subscribe((e) => $$.next(e));

  const notEphemeral = (doc: t.StoreIndexItem) => !doc.meta?.ephemeral;
  const getTotal = (index: t.StoreIndexDoc) => index.docs.filter(notEphemeral).length;
  const fire = (type: ChangeType, index: number, total: number, item: t.StoreIndexItem) => {
    if (!item) return;
    $$.next({ type, payload: { index, total, item } });
  };

  const docs$ = changed$.pipe(rx.filter((e) => e.patches[0].path[0] === 'docs'));
  docs$
    .pipe(
      rx.filter((e) => e.patches[0].action === 'insert'),
      rx.filter((e) => typeof e.patches[0].path[1] === 'number'),
    )
    .subscribe((e) => {
      const index = e.patches[0].path[1] as number;
      const item = e.after.docs[index];
      const total = getTotal(e.after);
      fire('crdt:store:index/Added', index, total, item);
    });

  docs$
    .pipe(
      rx.filter((e) => e.patches[0].action === 'del'),
      rx.filter((e) => typeof e.patches[0].path[1] === 'number'),
    )
    .subscribe((e) => {
      const index = e.patches[0].path[1] as number;
      const item = e.before.docs[index];
      const total = getTotal(e.after);
      fire('crdt:store:index/Removed', index, total, item);
    });

  docs$
    .pipe(
      rx.filter((e) => typeof e.patches[0].path[1] === 'number'),
      rx.filter((e) => e.patches[0].path[2] === 'shared'),
    )
    .subscribe((e) => {
      const index = e.patches[0].path[1] as number;
      const item = e.after.docs[index];
      const total = getTotal(e.after);
      fire('crdt:store:index/Shared', index, total, item);
    });

  docs$
    .pipe(
      rx.filter((e) => typeof e.patches[0].path[1] === 'number'),
      rx.filter((e) => e.patches[0].path[2] === 'name'),
    )
    .subscribe((e) => {
      const index = e.patches[0].path[1] as number;
      const item = e.after.docs[index];
      const total = getTotal(e.after);
      fire('crdt:store:index/Renamed', index, total, item);
    });

  /**
   * API
   */
  const api: t.StoreIndexEvents = {
    $,
    changed$,
    added$: rx.payload<t.StoreIndexAddedEvent>($, 'crdt:store:index/Added'),
    removed$: rx.payload<t.StoreIndexRemovedEvent>($, 'crdt:store:index/Removed'),
    shared$: rx.payload<t.StoreIndexSharedEvent>($, 'crdt:store:index/Shared'),
    renamed$: rx.payload<t.StoreIndexRenamedEvent>($, 'crdt:store:index/Renamed'),

    /**
     * Lifecycle
     */
    dispose,
    dispose$,
    get disposed() {
      return life.disposed;
    },
  };
  return api;
}
