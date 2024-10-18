import { useEffect } from 'react';
import { defaultIfEmpty } from 'rxjs';

import { Time, rx, type t } from './common.ts';

type LiMap = Map<number, HTMLLIElement>;

/**
 * Handle scrolling to a specific list-item
 * when the [scrollTo$] observable emits.
 */
export function useScrollController(
  baseRef: React.RefObject<HTMLDivElement>,
  itemRefs: LiMap,
  scrollToProp$?: t.Observable<t.ModuleListScrollTarget>,
) {
  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();

    let _latestIndex = -1;
    let _isScrolling = false;
    const scrolling$ = new rx.Subject<void>();
    const onScroll = () => scrolling$.next();
    baseRef.current?.addEventListener('scroll', onScroll);

    const scrollComplete$ = scrolling$.pipe(rx.takeUntil(dispose$), rx.debounceTime(50));
    scrolling$.subscribe(() => (_isScrolling = true));
    scrollComplete$.subscribe(() => (_isScrolling = false));

    /**
     * Bubble incoming property events into the local observable.
     */
    const scrollTo$ = new rx.Subject<t.ModuleListScrollTarget>();
    scrollToProp$?.pipe(rx.takeUntil(dispose$)).subscribe((e) => scrollTo$.next(e));

    /**
     * Listen for scroll-to-index requests.
     */
    scrollTo$.pipe(rx.takeUntil(dispose$)).subscribe((e) => (_latestIndex = e.index));
    scrollTo$
      .pipe(
        rx.takeUntil(dispose$),
        rx.filter(() => !_isScrolling),
      )
      .subscribe(async (e) => {
        const el = itemRefs.get(e.index);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Ensure the scroll-to-index target hasn't changed during the animation.
        const wait$ = scrollComplete$.pipe(defaultIfEmpty(-1));
        await rx.firstValueFrom(wait$);
        await Time.wait(0);
        if (e.index !== _latestIndex) scrollTo$.next({ index: _latestIndex });
      });

    return () => {
      dispose();
      scrolling$.complete();
      scrollTo$.complete();
      baseRef.current?.removeEventListener('scroll', onScroll);
    };
  }, [Boolean(scrollToProp$), itemRefs.size]);
}
