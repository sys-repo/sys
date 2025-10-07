import { type t, c, describe, expect, expectTypeOf, it, Rx, Schedule, Time } from '../../-test.ts';
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

  describe('Bus.ping/pong', () => {
    function print(events: t.EditorEvent[], suffix?: string) {
      console.info(c.cyan(`Events: Ping/Pong`), c.gray(suffix ?? ''));
      console.info();
      console.info(events);
      console.info();
    }

    it('emits correctly typed `ping` and `pong` events', async () => {
      const life = Rx.disposable();
      const bus$ = Bus.make();
      const events: t.EditorEvent[] = [];
      bus$.pipe(Rx.takeUntil(life.dispose$)).subscribe((e) => events.push(e));

      const nonce = 'n1';
      const req: t.EditorPingKind[] = ['yaml'];
      const states: t.EditorPingKind[] = ['yaml'];

      const ping = Bus.ping(bus$, req, nonce, 'ed1');
      const pong = Bus.pong(bus$, nonce, states);

      await Time.wait(1);

      // Type checks:
      expectTypeOf(ping).toEqualTypeOf<t.EventEditorPing>();
      expectTypeOf(pong).toEqualTypeOf<t.EventEditorPong>();

      // Runtime structure:
      expect(events.map((e) => e.kind)).to.eql(['editor:ping', 'editor:pong']);
      expect(ping.nonce).to.eql(nonce);
      expect(pong.states).to.eql(states);
      expect(pong.at).to.be.a('number');

      life.dispose();
      print(events);
    });

    it('ping: auto generate `nonce`', async () => {
      const life = Rx.disposable();
      const bus$ = Bus.make();
      const events: t.EditorEvent[] = [];
      bus$.pipe(Rx.takeUntil(life.dispose$)).subscribe((e) => events.push(e));

      const a = Bus.ping(bus$, ['cursor']);
      const b = Bus.ping(bus$, ['yaml']);
      await Time.wait(1);

      // Type checks:
      expectTypeOf(a).toEqualTypeOf<t.EventEditorPing>();
      expectTypeOf(b).toEqualTypeOf<t.EventEditorPing>();

      // Runtime structure:
      expect(typeof a.nonce === 'string').to.eql(true);
      expect(typeof b.nonce === 'string').to.eql(true);
      expect(a.nonce).to.not.eql(b.nonce);

      life.dispose();
      print(events, '← minimal params');
    });
  });
});
