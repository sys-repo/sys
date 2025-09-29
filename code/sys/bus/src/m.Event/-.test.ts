import { type t, describe, expect, expectTypeOf, it, Rx, Schedule } from '../-test.ts';
import { emit } from './mod.ts';

const makeBus = () => Rx.subject<t.EventWithKind>();

describe(`Event (core)`, () => {
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
});
