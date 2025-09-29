import { type t, Rx, describe, expect, expectTypeOf, it } from '../-test.ts';
import { emit } from '../m.Event/mod.ts';
import { Filter, FilterFor } from './mod.ts';

const make = () => Rx.subject<t.DebugEvent>();
const F = FilterFor<t.DebugEvent>(); // ← specialized filter

describe('Filter (type tools)', () => {
  it('API surface', async () => {
    const m = await import('@sys/bus');

    expect(m.Filter).to.equal(Filter);
    expect(m.FilterFor).to.equal(FilterFor);
  });

  it('isKind: runtime truth + compile-time narrowing', () => {
    const base: t.DebugBaseEvent = { kind: 'debug', msg: 'hi' };
    const a: t.DebugAEvent = { kind: 'debug:a', count: 1 };

    const isBase = F.isKind('debug');

    // runtime
    expect(isBase(base)).to.eql(true);
    expect(isBase(a)).to.eql(false);

    // compile-time (now narrows, no `never`)
    if (isBase(base)) {
      const _msg: string | undefined = base.msg;
      expectTypeOf(_msg).toEqualTypeOf<string | undefined>();
    }
  });

  it('hasPrefix: runtime truth + compile-time prefix narrowing', () => {
    const base: t.DebugBaseEvent = { kind: 'debug' };
    const a: t.DebugAEvent = { kind: 'debug:a', count: 1 };
    const ab: t.DebugABEvent = { kind: 'debug:a.b', total: 2 };

    const hasDebugPrefix = F.hasPrefix('debug:');
    expect(hasDebugPrefix(a)).to.eql(true);
    expect(hasDebugPrefix(ab)).to.eql(true);
    expect(hasDebugPrefix(base)).to.eql(false);

    if (hasDebugPrefix(ab)) {
      const isAorAB = F.isKind('debug:a', 'debug:a.b');
      if (isAorAB(ab)) {
        const _n: number = ab.total;
        expectTypeOf(_n).toEqualTypeOf<number>();
      }
    }
  });

  it('ofKind: filters stream by exact kind(s), preserving narrow types', () => {
    const bus$ = make();
    const seen: t.DebugEvent[] = [];

    const sub = bus$.pipe(F.ofKind('debug', 'debug:a')).subscribe((e) => seen.push(e));

    emit(bus$, { kind: 'debug', msg: 'a' } satisfies t.DebugBaseEvent, 'sync');
    emit(bus$, { kind: 'debug:a.b', total: 2 } satisfies t.DebugABEvent, 'sync');
    emit(bus$, { kind: 'debug:a', count: 1 } satisfies t.DebugAEvent, 'sync');

    sub.unsubscribe();
    expect(seen.map((e) => e.kind)).to.eql(['debug', 'debug:a']);
  });

  it('ofPrefix: filters stream by prefix, preserving narrow types', () => {
    const bus$ = make();
    const kinds: string[] = [];

    const sub = bus$.pipe(F.ofPrefix('debug:a')).subscribe((e) => kinds.push(e.kind));

    emit(bus$, { kind: 'debug', msg: 'noop' } satisfies t.DebugBaseEvent, 'sync'); // non-match
    emit(bus$, { kind: 'debug:a', count: 1 } satisfies t.DebugAEvent, 'sync');
    emit(bus$, { kind: 'debug:a.b', total: 2 } satisfies t.DebugABEvent, 'sync');
    emit(bus$, { kind: 'debug:a.b.c', flag: true } satisfies t.DebugABCEvent, 'sync');

    sub.unsubscribe();
    expect(kinds).to.eql(['debug:a', 'debug:a.b', 'debug:a.b.c']);
  });

  it('composition: prefix → kind (precise narrowing pipeline)', () => {
    const bus$ = make();
    const seen: t.DebugEvent[] = [];

    const sub = bus$
      .pipe(F.ofPrefix('debug:a'), F.ofKind('debug:a.b'))
      .subscribe((e) => seen.push(e));

    emit(bus$, { kind: 'debug', msg: 'noise' } satisfies t.DebugBaseEvent, 'sync');
    emit(bus$, { kind: 'debug:a', count: 1 } satisfies t.DebugAEvent, 'sync');
    emit(bus$, { kind: 'debug:a.b', total: 2 } satisfies t.DebugABEvent, 'sync');
    emit(bus$, { kind: 'debug:a.b.c', flag: true } satisfies t.DebugABCEvent, 'sync');

    sub.unsubscribe();

    expect(seen).to.have.length(1);
    expect(seen[0].kind).to.equal('debug:a.b');
  });

  it('predicate usage inside plain Rx.filter (no operators needed)', () => {
    const bus$ = make();
    const abOnly: t.DebugABEvent[] = [];

    const sub = bus$
      .pipe(Rx.filter(F.isKind('debug:a.b')))
      .subscribe((e) => abOnly.push(e as t.DebugABEvent));

    emit(bus$, { kind: 'debug', msg: 'skip' } satisfies t.DebugBaseEvent, 'sync');
    emit(bus$, { kind: 'debug:a.b', total: 3 } satisfies t.DebugABEvent, 'sync');

    sub.unsubscribe();
    expect(abOnly).to.have.length(1);
    expect(abOnly[0].total).to.equal(3);
  });

  it('no false positives: empty stream and non-matching kinds', () => {
    const bus$ = make();
    const seen: t.DebugEvent[] = [];

    const sub = bus$.pipe(F.ofKind('debug:a.b.c')).subscribe((e) => seen.push(e));
    emit(bus$, { kind: 'debug', msg: 'x' } satisfies t.DebugBaseEvent, 'sync');
    emit(bus$, { kind: 'debug:a', count: 1 } satisfies t.DebugAEvent, 'sync');

    sub.unsubscribe();
    expect(seen).to.eql([]);
  });
});
