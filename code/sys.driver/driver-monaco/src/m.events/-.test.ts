import { type t, describe, expect, it, Rx, Schedule } from '../-test.ts';
import { Bus } from './mod.ts';

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
          kind: 'editor:crdt:text',
          trigger: 'editor',
          path: ['a'] as t.ObjectPath,
          change: { before: '', after: '1' },
        },
        'micro',
      );
      await Schedule.micro();
      expect(seen.some((e) => e.kind === 'editor:crdt:text')).to.eql(true);

      // macro
      Bus.emit(
        bus$,
        {
          kind: 'editor:crdt:text',
          trigger: 'editor',
          path: ['b'] as t.ObjectPath,
          change: { before: '1', after: '2' },
        },
        'macro',
      );
      await Schedule.macro();
      expect(seen.filter((e) => e.kind === 'editor:crdt:text').length).to.be.greaterThan(0);

      // raf
      Bus.emit(
        bus$,
        {
          kind: 'editor:crdt:text',
          trigger: 'editor',
          path: ['c'] as t.ObjectPath,
          change: { before: '2', after: '3' },
        },
        'raf',
      );
      await Schedule.raf();
      expect(seen.filter((e) => e.kind === 'editor:crdt:text').length).to.be.greaterThan(0);
    });
  });

  describe('Bus.Filter (type tools)', () => {
    it('isKind: type guard + runtime truthiness', () => {
      const debug: t.EditorEvent = { kind: 'editor:debug', msg: 'hi' };
      const foldingReady: t.EditorEvent = { kind: 'editor:crdt:folding.ready', areas: [] };

      const isDebug = Bus.Filter.isKind('editor:debug');

      // runtime
      expect(isDebug(debug)).to.eql(true);
      expect(isDebug(foldingReady)).to.eql(false);

      // compile-time narrowing (no `as any`)
      if (isDebug(debug)) {
        // `debug` is now EventDebug – can access EventDebug-only props:
        const _s: string | undefined = debug.msg;
      }
    });
    it('hasPrefix: type guard by prefix', () => {
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

    it('ofKind: Rx operator filters stream by exact kind(s)', async () => {
      const bus$ = Bus.make();

      const seen: t.EditorEvent[] = [];
      const sub = bus$
        .pipe(Bus.Filter.ofKind('editor:debug', 'editor:crdt:folding.ready'))
        .subscribe((e) => seen.push(e));

      Bus.emit(bus$, { kind: 'editor:debug', msg: 'a' }, 'sync');
      Bus.emit(
        bus$,
        { kind: 'editor:crdt:text', trigger: 'crdt', path: [], change: { before: '', after: '' } },
        'sync',
      );
      Bus.emit(bus$, { kind: 'editor:crdt:folding.ready', areas: [] }, 'sync');

      // allow sync emissions to flush (they already have, but keep structure)
      sub.unsubscribe();

      expect(seen.map((e) => e.kind)).to.eql(['editor:debug', 'editor:crdt:folding.ready']);
    });

    it('ofPrefix: Rx operator filters stream by prefix', () => {
      const bus$ = Bus.make();

      const crdtKinds: string[] = [];
      const sub = bus$
        .pipe(Bus.Filter.ofPrefix('editor:crdt:'))
        .subscribe((e) => crdtKinds.push(e.kind));

      // prefer debug for non-match
      Bus.emit(bus$, { kind: 'editor:debug', msg: 'noop' }, 'sync');

      // a couple of CRDT events to match
      Bus.emit(
        bus$,
        {
          kind: 'editor:crdt:text',
          trigger: 'crdt',
          path: [],
          change: { before: 'a', after: 'b' },
        },
        'sync',
      );
      Bus.emit(bus$, { kind: 'editor:crdt:folding.ready', areas: [] }, 'sync');

      sub.unsubscribe();

      expect(crdtKinds).to.eql(['editor:crdt:text', 'editor:crdt:folding.ready']);
    });

    it('composition: prefix → kind', () => {
      const bus$ = Bus.make();

      const seen: t.EditorEvent[] = [];
      const sub = bus$
        .pipe(
          Bus.Filter.ofPrefix('editor:crdt:'), //      ← prefix narrow
          Bus.Filter.ofKind('editor:crdt:folding'), // ← then exact kind
        )
        .subscribe((e) => seen.push(e));

      // noise
      Bus.emit(bus$, { kind: 'editor:debug', msg: 'noise' }, 'sync');
      Bus.emit(
        bus$,
        { kind: 'editor:crdt:text', trigger: 'crdt', path: [], change: { before: '', after: '' } },
        'sync',
      );

      // match
      Bus.emit(bus$, { kind: 'editor:crdt:folding', trigger: 'editor', areas: [] }, 'sync');

      sub.unsubscribe();

      expect(seen).to.have.length(1);
      expect(seen[0].kind).to.equal('editor:crdt:folding');
    });

    it('works as a predicate inside plain Rx.filter too', () => {
      const bus$ = Bus.make();

      const seen: t.EventYamlChange[] = [];
      const sub = bus$
        .pipe(
          // at this point e is narrowed to EventYaml:
          Rx.filter(Bus.Filter.isKind('editor:yaml:change')),
        )
        .subscribe((e) => seen.push(e));

      Bus.emit(bus$, { kind: 'editor:debug', msg: 'skip' }, 'sync');
      Bus.emit(bus$, { kind: 'editor:yaml:change', yaml: { ok: true } as t.EditorYaml }, 'sync');

      sub.unsubscribe();
      expect(seen).to.have.length(1);
      expect(seen[0].kind).to.equal('editor:yaml:change');
    });
  });
});
