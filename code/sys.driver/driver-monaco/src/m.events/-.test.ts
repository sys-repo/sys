import { type t, describe, expect, it, Schedule } from '../-test.ts';
import { Bus } from './mod.ts';

describe(`Editor Events`, () => {
  describe('Bus', () => {
    it('make(): creates a subject that can receive events', () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      const sub = bus$.subscribe((e) => seen.push(e));

      const evt: t.EventText = {
        kind: 'text',
        trigger: 'editor',
        path: ['doc'] as t.ObjectPath,
        change: { before: 'a', after: 'b' },
      };
      bus$.next(evt);

      expect(seen).to.eql([evt]);
      sub.unsubscribe();
    });

    it('emit(): delivers events (sync)', () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      bus$.subscribe((e) => seen.push(e));

      const evt: t.EventText = {
        kind: 'text',
        trigger: 'editor',
        path: ['foo'] as t.ObjectPath,
        change: { before: 'x', after: 'y' },
      };
      Bus.emit(bus$, evt, 'sync');

      expect(seen).to.eql([evt]);
    });

    it('emit(): delivers events (micro/macro/raf)', async () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      bus$.subscribe((e) => seen.push(e));

      // micro
      Bus.emit(
        bus$,
        {
          kind: 'text',
          trigger: 'editor',
          path: ['a'] as t.ObjectPath,
          change: { before: '', after: '1' },
        },
        'micro',
      );
      await Schedule.micro();
      expect(seen.some((e) => e.kind === 'text')).to.eql(true);

      // macro
      Bus.emit(
        bus$,
        {
          kind: 'text',
          trigger: 'editor',
          path: ['b'] as t.ObjectPath,
          change: { before: '1', after: '2' },
        },
        'macro',
      );
      await Schedule.macro();
      expect(seen.filter((e) => e.kind === 'text').length).to.be.greaterThan(0);

      // raf
      Bus.emit(
        bus$,
        {
          kind: 'text',
          trigger: 'editor',
          path: ['c'] as t.ObjectPath,
          change: { before: '2', after: '3' },
        },
        'raf',
      );
      await Schedule.raf();
      expect(seen.filter((e) => e.kind === 'text').length).to.be.greaterThan(0);
    });
  });
});
