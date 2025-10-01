import { type t, describe, expect, expectTypeOf, it, Rx, Schedule } from '../../-test.ts';
import { Bus } from '../mod.ts';

describe(`Editor Events`, () => {
  describe('Bus', () => {
    it('make(): creates a subject that can receive events', () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      const sub = bus$.subscribe((e) => seen.push(e));

      const evt: t.EventCrdtText = {
        kind: 'editor:crdt:text',
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

      const evt: t.EventCrdtText = {
        kind: 'editor:crdt:text',
        trigger: 'editor',
        path: ['foo'] as t.ObjectPath,
        change: { before: 'x', after: 'y' },
      };
      Bus.emit(bus$, 'sync', evt);

      expect(seen).to.eql([evt]);
    });

    it('emit(): delivers events (micro/macro/raf)', async () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];
      bus$.subscribe((e) => seen.push(e));

      // micro
      Bus.emit(bus$, 'micro', {
        kind: 'editor:crdt:text',
        trigger: 'editor',
        path: ['a'] as t.ObjectPath,
        change: { before: '', after: '1' },
      });
      await Schedule.micro();
      expect(seen.some((e) => e.kind === 'editor:crdt:text')).to.eql(true);

      // macro
      Bus.emit(bus$, 'macro', {
        kind: 'editor:crdt:text',
        trigger: 'editor',
        path: ['b'] as t.ObjectPath,
        change: { before: '1', after: '2' },
      });
      await Schedule.macro();
      expect(seen.filter((e) => e.kind === 'editor:crdt:text').length).to.be.greaterThan(0);

      // raf
      Bus.emit(bus$, 'raf', {
        kind: 'editor:crdt:text',
        trigger: 'editor',
        path: ['c'] as t.ObjectPath,
        change: { before: '2', after: '3' },
      });
      await Schedule.raf();
      expect(seen.filter((e) => e.kind === 'editor:crdt:text').length).to.be.greaterThan(0);
    });
  });

  describe('Bus.Filter (editor events)', () => {
    it('isKind: runtime truth + compile-time narrowing', () => {
      const debug: t.EditorEvent = { kind: 'editor:debug', msg: 'hi' };
      const foldingReady: t.EditorEvent = { kind: 'editor:crdt:folding:ready', areas: [] };

      const isDebug = Bus.Filter.isKind('editor:debug');

      // runtime truth
      expect(isDebug(debug)).to.eql(true);
      expect(isDebug(foldingReady)).to.eql(false);

      // compile-time narrowing (no `as any`)
      if (isDebug(debug)) {
        const _msg: string | undefined = debug.msg;
        expectTypeOf(_msg).toEqualTypeOf<string | undefined>();
      }
    });

    it('hasPrefix: prefix guard + chained narrowing', () => {
      const debug: t.EditorEvent = { kind: 'editor:debug' };
      const text: t.EditorEvent = {
        kind: 'editor:crdt:text',
        trigger: 'crdt',
        path: [],
        change: { before: '', after: '' },
      };

      const isCrdt = Bus.Filter.hasPrefix('editor:crdt:');
      expect(isCrdt(text)).to.eql(true);
      expect(isCrdt(debug)).to.eql(false);

      if (isCrdt(text)) {
        const isPathEvent = Bus.Filter.isKind('editor:crdt:text', 'editor:crdt:marks');
        if (isPathEvent(text)) {
          const _p: t.ObjectPath = text.path;
          void _p;
        }
      }
    });

    it('ofKind: filters stream by exact kind(s)', () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];

      const sub = bus$
        .pipe(Bus.Filter.ofKind('editor:debug', 'editor:crdt:folding:ready'))
        .subscribe((e) => seen.push(e));

      Bus.emit(bus$, 'sync', { kind: 'editor:debug', msg: 'a' } satisfies t.EventDebug);
      Bus.emit(bus$, 'sync', {
        kind: 'editor:crdt:text',
        trigger: 'crdt',
        path: [],
        change: { before: '', after: '' },
      } satisfies t.EventCrdtText);
      Bus.emit(bus$, 'sync', {
        kind: 'editor:crdt:folding:ready',
        areas: [],
      } satisfies t.EventCrdtFoldingReady);

      sub.unsubscribe();
      expect(seen.map((e) => e.kind)).to.eql(['editor:debug', 'editor:crdt:folding:ready']);
    });

    it('ofPrefix: filters stream by prefix', () => {
      const bus$ = Bus.make();
      const crdtKinds: string[] = [];

      const sub = bus$
        .pipe(Bus.Filter.ofPrefix('editor:crdt:'))
        .subscribe((e) => crdtKinds.push(e.kind));

      // non-match
      Bus.emit(bus$, 'sync', { kind: 'editor:debug', msg: 'noop' } satisfies t.EventDebug);

      // matches
      Bus.emit(bus$, 'sync', {
        kind: 'editor:crdt:text',
        trigger: 'crdt',
        path: [],
        change: { before: 'a', after: 'b' },
      } satisfies t.EventCrdtText);
      Bus.emit(bus$, 'sync', {
        kind: 'editor:crdt:folding:ready',
        areas: [],
      } satisfies t.EventCrdtFoldingReady);

      sub.unsubscribe();
      expect(crdtKinds).to.eql(['editor:crdt:text', 'editor:crdt:folding:ready']);
    });

    it('composition: prefix → kind', () => {
      const bus$ = Bus.make();
      const seen: t.EditorEvent[] = [];

      const sub = bus$
        .pipe(
          Bus.Filter.ofPrefix('editor:crdt:'), //      ← prefix narrow
          Bus.Filter.ofKind('editor:crdt:folding'), // ← exact kind
        )
        .subscribe((e) => seen.push(e));

      // noise:
      Bus.emit(bus$, 'sync', { kind: 'editor:debug', msg: 'noise' } satisfies t.EventDebug);
      Bus.emit(bus$, 'sync', {
        kind: 'editor:crdt:text',
        trigger: 'crdt',
        path: [],
        change: { before: '', after: '' },
      } satisfies t.EventCrdtText);

      // match:
      Bus.emit(bus$, 'sync', {
        kind: 'editor:crdt:folding',
        trigger: 'editor',
        areas: [],
      } satisfies t.EventCrdtFolding);

      sub.unsubscribe();
      expect(seen).to.have.length(1);
      expect(seen[0].kind === 'editor:crdt:folding').to.be.true;
    });

    it('predicate inside plain Rx.filter (no operator)', () => {
      const bus$ = Bus.make();
      const seen: t.EventCrdtFoldingReady[] = [];

      const sub = bus$
        .pipe(Rx.filter(Bus.Filter.isKind('editor:crdt:folding:ready')))
        .subscribe((e) => seen.push(e as t.EventCrdtFoldingReady));

      Bus.emit(bus$, 'sync', { kind: 'editor:debug', msg: 'skip' } satisfies t.EventDebug);
      Bus.emit(bus$, 'sync', {
        kind: 'editor:crdt:folding:ready',
        areas: [],
      } satisfies t.EventCrdtFoldingReady);

      sub.unsubscribe();
      expect(seen).to.have.length(1);
      expect(seen[0].kind === 'editor:crdt:folding:ready').to.be.true;
    });
  });
});
