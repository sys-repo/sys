import jsonpatch from 'fast-json-patch';
import { Is, Time, describe, expect, it, rx, slug, type t } from '../-test.ts';
import { Patch, PatchState } from '../mod.ts';

describe('PatchState', () => {
  type T = { label: string; list?: number[] };

  describe('init', () => {
    it('init: (default)', (e) => {
      const initial: T = { label: 'foo', list: [] };
      const state = PatchState.create<T>(initial);
      const value = state.current;
      expect(value).to.eql(initial);
      expect(state.current).to.equal(value); // NB: no change, same instance.
    });

    it('init: instance { id }', (e) => {
      const initial: T = { label: 'foo' };
      const state1 = PatchState.create(initial);
      const state2 = PatchState.create(initial);
      expect(state1.instance).to.not.eql(state2.instance);
    });

    it('init: <typename>', () => {
      const initial: T = { label: 'foo' };
      const typename = 'foo.bar';
      const state1 = PatchState.create(initial);
      const state2 = PatchState.create(initial, { typename });
      expect(state1.typename).to.eql(undefined);
      expect(state2.typename).to.eql(typename);
    });
  });

  describe('change', () => {
    it('change', (e) => {
      const initial: T = { label: 'foo' };
      const state = PatchState.create(initial);
      const before = state.current;
      state.change((draft) => (draft.label = 'hello'));
      const after = state.current;

      expect(before.label).to.eql('foo');
      expect(after.label).to.eql('hello');
      expect(before).to.not.equal(after); // NB: different instance.
    });

    it('onChange (callback → patches)', (e) => {
      const initial: T = { label: 'foo' };
      const fired: t.PatchChange<T>[] = [];
      const state = PatchState.create(initial, { onChange: (e) => fired.push(e) });
      state.change((draft) => (draft.label = 'hello'));

      expect(fired.length).to.eql(1);
      expect(fired[0].op).to.eql('update');
      expect(fired[0].before).to.eql({ label: 'foo' });
      expect(fired[0].after).to.eql({ label: 'hello' });
      expect(fired[0].patches.next.length).to.eql(1);
    });

    it('patches (callback option)', () => {
      const initial: T = { label: 'foo', list: [] };
      const state = PatchState.create(initial);
      const patches: t.PatchOperation[] = [];

      state.change((draft) => (draft.label = 'hello'), { patches: (e) => patches.push(...e) });
      state.change(
        (draft) => {
          draft.list![0] = 123;
          draft.list![1] = 456;
        },
        (e) => patches.push(...e),
      );

      expect(patches.length).to.eql(3);
      expect(patches[0]).to.eql({ op: 'replace', path: '/label', value: 'hello' });
      expect(patches[1]).to.eql({ op: 'add', path: '/list/0', value: 123 });
      expect(patches[2]).to.eql({ op: 'add', path: '/list/1', value: 456 });
    });

    it('replay patches (RFC-6902 JSON patch)', async () => {
      const initial: T = { label: 'foo', list: [] };
      const state = PatchState.create(initial);
      const patches: t.PatchOperation[] = [];

      state.change(
        (draft) => {
          draft.label = 'hello';
          draft.list![0] = 123;
          draft.list![1] = 456;
        },
        (e) => patches.push(...e),
      );

      const res = jsonpatch.applyPatch({ list: [] }, patches).newDocument;
      expect(res).to.eql({ label: 'hello', list: [123, 456] });
    });
  });

  describe('events → default', () => {
    it('distinct instances', () => {
      const initial: T = { label: 'foo' };
      const state = PatchState.create(initial);
      const events1 = state.events();
      const events2 = state.events();
      expect(events1).to.not.equal(events2);
    });

    it('fires patch/change event', () => {
      const initial: T = { label: 'foo' };
      const state = PatchState.create(initial);
      const fired: t.PatchChange<T>[] = [];
      const events = state.events();
      events.$.subscribe((e) => fired.push(e));

      state.change((draft) => (draft.label = 'hello'));
      expect(fired.length).to.eql(1);
      expect(fired[0].op).to.eql('update');
      expect(fired[0].before).to.eql({ label: 'foo' });
      expect(fired[0].after).to.eql({ label: 'hello' });
      expect(fired[0].patches.next.length).to.eql(1);
    });

    it('dispose() ← via method', () => {
      const initial: T = { label: 'foo' };
      const state = PatchState.create(initial);
      const fired: t.PatchChange<T>[] = [];
      const events = state.events();
      events.$.subscribe((e) => fired.push(e));
      events.dispose();
      state.change((draft) => (draft.label = 'hello'));
      expect(fired.length).to.eql(0);
    });

    it('dispose$ ← via observable', () => {
      const initial: T = { label: 'foo' };
      const state = PatchState.create(initial);
      const fired: t.PatchChange<T>[] = [];
      const dispose$ = rx.subject();
      const events = state.events(dispose$);
      events.$.subscribe((e) => fired.push(e));
      dispose$.next();
      state.change((draft) => (draft.label = 'hello'));
      expect(fired.length).to.eql(0);
    });
  });

  describe('events → injected', () => {
    type E = {
      disposed: boolean;
      change$: t.Observable<T>;
    };

    type TFactory = t.PatchStateEventFactory<T, E>;
    const exampleFactory: TFactory = ($, dispose$) => {
      const life = rx.lifecycle(dispose$);
      return {
        change$: $.pipe(rx.map((e) => e.after)),
        get disposed() {
          return life.disposed; // NB: typically you'd implement a complete [t.Lifecycle] interface.
        },
      };
    };

    it('init (via injected factory)', () => {
      let count = 0;
      const events: TFactory = ($, dispose$) => {
        count++;
        return exampleFactory($, dispose$);
      };

      const initial: T = { label: 'foo' };
      const state = PatchState.create<T, E>(initial, { events });
      const res = state.events();

      expect(count).to.eql(1);
      expect(Is.observable(res.change$)).to.eql(true);
      expect(res.disposed).to.eql(false);

      expect(state.events()).to.not.equal(res); // NB: different instances.
      expect(state.events()).to.not.equal(res);
      expect(count).to.eql(3);
    });

    it('dispose', () => {
      const events: TFactory = ($, dispose$) => exampleFactory($, dispose$);
      const initial: T = { label: 'foo' };
      const state = PatchState.create<T, E>(initial, { events });

      const dispose$ = rx.subject();
      const res = state.events(dispose$);

      expect(res.disposed).to.eql(false);
      dispose$.next();
      expect(res.disposed).to.eql(true);
    });

    it('change$', () => {
      const events: TFactory = ($, dispose$) => exampleFactory($, dispose$);
      const initial: T = { label: 'foo' };
      const state = PatchState.create<T, E>(initial, { events });
      const res = state.events();

      const fired: T[] = [];
      res.change$.subscribe((e) => fired.push(e));

      state.change((d) => (d.label = 'hello'));
      expect(fired[0].label).to.eql('hello');
    });
  });

  describe('PatchState.Is', () => {
    it('Is.proxy ← true', () => {
      let proxy = false;
      Patch.change({ foo: 123 }, (draft) => (proxy = PatchState.Is.proxy(draft)));
      expect(proxy).to.eql(true);
    });

    it('Is.proxy ← false', () => {
      [undefined, null, {}, [], '', 123, true].forEach((value) => {
        expect(PatchState.Is.proxy(value)).to.eql(false);
      });
    });

    it('Is.state ← true', () => {
      const initial: T = { label: 'foo' };
      const state = PatchState.create<T>(initial);
      expect(PatchState.Is.state(state)).to.eql(true);
    });

    it('Is.state ← false', () => {
      [undefined, null, {}, [], '', 123, true].forEach((value) => {
        expect(PatchState.Is.state(value)).to.eql(false);
      });
    });

    it('Is.type ← true', () => {
      const typename = 'foo.bar';
      const initial: T = { label: 'foo' };
      const state = PatchState.create<T>(initial, { typename });
      expect(PatchState.Is.type(state, typename)).to.eql(true);
    });

    it('Is.type ← false', () => {
      const type = 'foo.bar';
      const initial: T = { label: 'foo' };
      const state = PatchState.create<T>(initial);
      expect(PatchState.Is.type(state, type)).to.eql(false); // NB: no "type" field.
      [undefined, null, {}, [], '', 123, true].forEach((value) => {
        expect(PatchState.Is.type(value, type)).to.eql(false);
      });
    });
  });

  /**
   * TODO 🐷
   * Note (Obsolete): This should be replaced with the [sys.cmd] library.
   */
  describe('Command (Dispatcher)', () => {
    type Cmd = OneCmd | TwoCmd;

    type OneCmd = { type: 'foo.one'; payload: One };
    type One = { tx: string; msg: string };

    type TwoCmd = { type: 'foo.two'; payload: Two };
    type Two = { tx: string; count: number };

    type T = { cmd?: Cmd };
    type E = {
      $: t.Observable<t.PatchChange<T>>;
      cmd: {
        $: t.Observable<Cmd>;
        one$: t.Observable<One>;
        two$: t.Observable<Two>;
      };
    };

    type TFactory = t.PatchStateEventFactory<T, E>;
    const factory: TFactory = ($, dispose$) => {
      const cmd$ = PatchState.Command.filter($, dispose$);
      return {
        $,
        cmd: {
          $: cmd$,
          one$: rx.payload<OneCmd>(cmd$, 'foo.one'),
          two$: rx.payload<TwoCmd>(cmd$, 'foo.two'),
        },
      };
    };

    it('no params', () => {
      const dispatch = PatchState.Command.dispatcher<Cmd>();
      expect(dispatch).to.be.a('function');
    });

    it('dispatches a command', async () => {
      const state = PatchState.create<T, E>({}, { events: factory });
      const events = state.events();

      const firedOne: One[] = [];
      const firedTwo: Two[] = [];
      events.cmd.one$.subscribe((e) => firedOne.push(e));
      events.cmd.two$.subscribe((e) => firedTwo.push(e));

      const dispatch = PatchState.Command.dispatcher<Cmd>(state);
      dispatch({ type: 'foo.one', payload: { tx: slug(), msg: 'hello' } });
      dispatch({ type: 'foo.two', payload: { tx: slug(), count: 123 } });
      dispatch({ type: 'foo.two', payload: { tx: slug(), count: 456 } });

      expect(firedOne[0].msg).to.eql('hello');
      expect(firedTwo[0].count).to.eql(123);
      expect(firedTwo[1].count).to.eql(456);

      expect((state.current.cmd?.payload as Two).count).to.eql(456);
      await Time.wait(0);
      expect(state.current.cmd).to.eql(undefined); // NB: reset (no longer needed after event is published)
    });
  });
});
