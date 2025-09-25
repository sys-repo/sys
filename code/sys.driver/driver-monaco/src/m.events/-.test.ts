import { type t, describe, expect, it, Schedule } from '../-test.ts';
import { Bus } from './mod.ts';

describe(`Editor Events`, () => {
  describe('Bus', () => {
    it('make(): creates a subject that can receive events', () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      const sub = bus$.subscribe((e) => seen.push(e));

      const evt: t.EditorEvent = { kind: 'text:ready', path: ['doc'] as t.ObjectPath };
      bus$.next(evt);

      expect(seen).to.eql([evt]);
      sub.unsubscribe();
    });

    it('emit(): delivers events (sync)', () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      bus$.subscribe((e) => seen.push(e));

      const evt: t.EditorEvent = { kind: 'marks:ready', path: ['foo'] as t.ObjectPath };
      Bus.emit(bus$, evt, 'sync');

      expect(seen).to.eql([evt]);
    });

    it('emit(): delivers events (micro/macro/raf)', async () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      bus$.subscribe((e) => seen.push(e));

      // micro
      Bus.emit(bus$, { kind: 'marks:ready', path: ['a'] as t.ObjectPath }, 'micro');
      await Schedule.micro();
      expect(seen.some((e) => e.kind === 'marks:ready')).to.eql(true);

      // macro
      Bus.emit(bus$, { kind: 'text:ready', path: ['b'] as t.ObjectPath }, 'macro');
      await Schedule.macro();
      expect(seen.some((e) => e.kind === 'text:ready')).to.eql(true);

      // raf
      Bus.emit(bus$, { kind: 'text:ready', path: ['c'] as t.ObjectPath }, 'raf');
      await Schedule.raf();
      expect(seen.filter((e) => e.kind === 'text:ready').length).to.be.greaterThan(0);
    });
  });
});
