import { type t, c, Rx, Time } from './common.ts';
import { Fmt } from './u.fmt.ts';

/**
 * Keep documents syncing locally.
 */
export async function sync(index: t.CrdtIndexDocRef, repo: t.Crdt.Repo, until?: t.UntilObservable) {
  const items = (index.current.watching ?? []).sort((a, b) => a.addedAt - b.addedAt).toReversed();

  if (items.length === 0) {
    return void Fmt.noDocuments();
  }

  const appendColumn = (e: t.CrdtIndexItem) => {
    if (!changed.has(e.docid)) return;
    const elapsed = Time.elapsed(changed.get(e.docid) ?? 0);
    return c.gray(`changed ${c.white(elapsed.toString())} ago`);
  };

  const print = () => {
    console.clear();
    console.info(c.gray(`${repo.sync.urls.join(', ')}`));
    console.info(Fmt.itemTable(items, { appendColumn }));
    console.info();
  };

  const changed = new Map<t.StringId, t.UnixTimestamp>();
  const changed$ = Rx.subject();
  const life = Rx.lifecycle(until);
  changed$.pipe(Rx.takeUntil(life.dispose$), Rx.debounceTime(300)).subscribe(print);

  const listen = async (item: t.CrdtIndexItem) => {
    const id = item.docid;
    const res = await repo.get(id);
    const doc = res.doc;
    doc?.events(until).$.subscribe((e) => {
      changed.set(id, Time.now.timestamp);
      changed$.next();
    });
  };

  print();
  Rx.interval(5_000)
    .pipe(
      Rx.takeUntil(life.dispose$),
      // Rx.map(() => changed.size),
      // Rx.distinctWhile((p, n) => p === n),
    )
    .subscribe(print);

  await repo.whenReady();
  await Promise.all(items.map(listen));
}
