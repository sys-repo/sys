import { type t, describe, expect, it, Schedule } from '../-test.ts';
import { Bus } from './mod.ts';

describe(`Editor Events`, () => {
  describe('Bus', () => {
    it('make(): creates a subject that can receive events', () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      const sub = bus$.subscribe((e) => seen.push(e));

      const evt: t.EditorEvent = { kind: 'ready:text', path: ['doc'] as t.ObjectPath };
      bus$.next(evt);

      expect(seen).to.eql([evt]);
      sub.unsubscribe();
    });

    it('emit(): delivers events (sync)', () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      bus$.subscribe((e) => seen.push(e));

      const evt: t.EditorEvent = { kind: 'ready:marks', path: ['foo'] as t.ObjectPath };
      Bus.emit(bus$, evt, 'sync');

      expect(seen).to.eql([evt]);
    });

    it('emit(): delivers events (micro/macro/raf)', async () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      bus$.subscribe((e) => seen.push(e));

      // micro
      Bus.emit(bus$, { kind: 'ready:marks', path: ['a'] as t.ObjectPath }, 'micro');
      await Schedule.micro();
      expect(seen.some((e) => e.kind === 'ready:marks')).to.eql(true);

      // macro
      Bus.emit(bus$, { kind: 'ready:text', path: ['b'] as t.ObjectPath }, 'macro');
      await Schedule.macro();
      expect(seen.some((e) => e.kind === 'ready:text')).to.eql(true);

      // raf
      Bus.emit(bus$, { kind: 'ready:text', path: ['c'] as t.ObjectPath }, 'raf');
      await Schedule.raf();
      expect(seen.filter((e) => e.kind === 'ready:text').length).to.be.greaterThan(0);
    });
  });
});
