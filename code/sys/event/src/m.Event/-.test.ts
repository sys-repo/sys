import { type t, describe, expect, expectTypeOf, it, Rx, Schedule } from '../-test.ts';
import { emit, emitFor } from './mod.ts';

describe(`Event (@module)`, () => {
  const makeBus = () => Rx.subject<t.EventWithKind>();

  it('API', async () => {
    const m = await import('@sys/event/bus');
    expect(m.emit).to.equal(emit);
    expect(m.emitFor).to.equal(m.emitFor);
  });

  it('types', () => {
    const e: t.EventWithKind = { kind: 'foo' };
    expectTypeOf(e).toEqualTypeOf<t.EventWithKind>();
  });

  describe('emit', () => {
    it('sync: inline (immediate) emission', () => {
      const bus$ = makeBus();
      const order: string[] = [];

      bus$.subscribe(() => order.push('evt'));
      order.push('before');
      emit(bus$, { kind: 'debug' }, 'sync'); // immediate
      order.push('after');

      expect(order).to.eql(['before', 'evt', 'after']);
    });

    it('micro (default): after current turn, before macro/raf', async () => {
      const bus$ = makeBus();
      const order: string[] = [];

      bus$.subscribe(() => order.push('evt'));
      order.push('before');
      emit(bus$, { kind: 'debug' }); // default = micro
      order.push('after');

      // Flush microtasks:
      await new Promise<void>((resolve) => Schedule.micro(resolve));

      expect(order).to.eql(['before', 'after', 'evt']);
    });

    it('macro: next timer tick (after micro)', async () => {
      const bus$ = makeBus();
      const order: string[] = [];

      bus$.subscribe(() => order.push('evt'));
      order.push('before');
      emit(bus$, { kind: 'debug' }, 'macro');
      order.push('after-macro-scheduled');

      // Micro first: nothing yet.
      await new Promise<void>((resolve) => Schedule.micro(resolve));
      expect(order).to.eql(['before', 'after-macro-scheduled']);

      // Now macro tick delivers:
      await new Promise<void>((resolve) => Schedule.macro(resolve));
      expect(order).to.eql(['before', 'after-macro-scheduled', 'evt']);
    });

    it('raf: next animation frame (~16ms fallback) — not sync; delivered by raf', async () => {
      const bus$ = makeBus();
      const order: string[] = [];

      bus$.subscribe(() => order.push('evt'));
      order.push('before');

      emit(bus$, { kind: 'debug' }, 'raf'); // schedule raf
      order.push('after-raf-scheduled');

      // 1) Not sync: nothing should have been pushed inline.
      const idxAfterSchedule = order.length - 1;
      expect(order[idxAfterSchedule]).to.equal('after-raf-scheduled');

      // 2) By the raf tick, the event must have been delivered (regardless of impl).
      await new Promise<void>((resolve) => Schedule.raf(resolve));

      expect(order.includes('evt')).to.eql(true);

      // 3) Emission happened after scheduling.
      const emitIndex = order.indexOf('evt');
      expect(emitIndex).to.be.greaterThan(idxAfterSchedule);
    });
  });

  describe('emitFor (factory)', () => {
    it('returns a specialized emitter with precise type', () => {
      const emitDebug = emitFor<t.DebugEvent>();

      // Exact function type
      expectTypeOf(emitDebug).toEqualTypeOf<t.EmitEvent<t.DebugEvent>>();

      // Parameter tuple
      type Params = Parameters<typeof emitDebug>;
      expectTypeOf([] as unknown as Params).toEqualTypeOf<
        [t.Subject<t.DebugEvent>, t.DebugEvent, t.EmitEventSchedule?]
      >();

      // Return type
      type Ret = ReturnType<typeof emitDebug>;
      expectTypeOf(undefined as Ret).toEqualTypeOf<void>();
    });

    it('runtime smoke: uses the specialized emitter', () => {
      const bus$ = Rx.subject<t.DebugEvent>();
      const seen: string[] = [];
      const sub = bus$.subscribe((e) => seen.push(e.kind));

      const emitDebug = emitFor<t.DebugEvent>();
      emitDebug(bus$, { kind: 'debug' } satisfies t.DebugBaseEvent, 'sync');
      emitDebug(bus$, { kind: 'debug:a', count: 1 } satisfies t.DebugAEvent, 'sync');
      emitDebug(bus$, { kind: 'debug:a.b', total: 2 } satisfies t.DebugABEvent, 'sync');
      emitDebug(bus$, { kind: 'debug:a.b.c', flag: true } satisfies t.DebugABCEvent, 'sync');

      sub.unsubscribe();
      expect(seen).to.eql(['debug', 'debug:a', 'debug:a.b', 'debug:a.b.c']);
    });

    it('type-safety: rejects mismatched unions at compile time', () => {
      const bus$ = Rx.subject<t.DebugEvent>();
      const emitDebug = emitFor<t.DebugEvent>();

      // Local "other" union for negative checks (not part of t.*)
      type OtherEvent = { readonly kind: 'other' };

      // Wrong event type:
      // @ts-expect-error OtherEvent is not assignable to DebugEvent
      emitDebug(bus$, { kind: 'other' } as OtherEvent);

      const wrongBus$ = Rx.subject<OtherEvent>();

      // Wrong subject type:
      // @ts-expect-error Subject<OtherEvent> is not assignable to Subject<DebugEvent>
      emitDebug(wrongBus$, { kind: 'debug' } satisfies t.DebugBaseEvent);
    });

    it('interoperates with generic `emit` (inference at call sites)', () => {
      const bus$ = Rx.subject<t.DebugEvent>();
      const seen: string[] = [];
      const sub = bus$.subscribe((e) => seen.push(e.kind));

      // Generic `emit` infers <E = DebugEvent> from Subject<DebugEvent>
      emit(bus$, { kind: 'debug:a.b', total: 42 } satisfies t.DebugABEvent, 'sync');

      sub.unsubscribe();
      expect(seen).to.eql(['debug:a.b']);
    });
  });
});
