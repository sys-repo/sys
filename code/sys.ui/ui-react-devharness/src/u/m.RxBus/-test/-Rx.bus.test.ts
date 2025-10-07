import { type t, describe, expect, it, Rx, Time } from '../../../-test.ts';
import { RxBus } from '../mod.ts';

describe('RxBus', () => {
  describe('isBus', () => {
    it('is bus', () => {
      const test = (input: any) => expect(RxBus.isBus(input)).to.eql(true);
      test({ $: new Rx.Observable(), fire: () => null });
      test(RxBus());
    });

    it('is not a bus', () => {
      const test = (input: any) => {
        expect(RxBus.isBus(input)).to.eql(false);
      };
      test(undefined);
      test(null);
      test(123);
      test({});
      test([123, {}]);
      test({ event$: new Rx.Observable() });
      test({ $: new Rx.Observable() });
      test({ fire: () => null });
    });
  });

  describe('busAsType', () => {
    type MyEvent = IFooEvent | IBarEvent;
    type IFooEvent = { type: 'Event/foo'; payload: { count?: number } };
    type IBarEvent = { type: 'Event/bar'; payload: { count?: number } };

    it('changes event type', () => {
      const bus1 = RxBus();

      const fired: t.Event[] = [];
      bus1.$.subscribe((e) => fired.push(e));

      const bus2 = RxBus.asType<MyEvent>(bus1);
      bus2.fire({ type: 'Event/bar', payload: {} });

      expect(fired.length).to.eql(1);
      expect(fired[0].type).to.eql('Event/bar');
    });
  });

  describe('bus (factory)', () => {
    type MyEvent = IFooEvent | IBarEvent;
    type IFooEvent = { type: 'Event/foo'; payload: { count?: number } };
    type IBarEvent = { type: 'Event/bar'; payload: { count?: number } };

    it('_instance (hidden "id")', () => {
      const bus = RxBus();
      const _instance = (bus as any)._instance as string;
      expect(typeof _instance).to.eql('string');
      expect(_instance.startsWith('bus.')).to.eql(true);
      expect(_instance.length).to.greaterThan('bus.'.length);
    });

    it('RxBus.instance(...)', () => {
      const bus = RxBus();
      const _instance = (bus as any)._instance as string;
      expect(RxBus.instance(bus)).to.eql(_instance);
      expect(RxBus.instance({} as any)).to.eql('');
    });

    it('create: new observable (no param, no type)', () => {
      const bus = RxBus();

      const fired: t.Event[] = [];
      bus.$.subscribe((e) => fired.push(e));

      bus.fire({ type: 'ANY', payload: {} });

      expect(fired.length).to.eql(1);
      expect(fired[0].type).to.eql('ANY');
    });

    it('create: use given subject', () => {
      const source$ = new Rx.Subject<any>(); // NB: Does not care the typing of the input observable (flexible).
      const bus = RxBus<MyEvent>(source$);

      const fired: MyEvent[] = [];
      bus.$.subscribe((e) => fired.push(e));

      source$.next({ type: 'ANY', payload: {} });

      bus.fire({ type: 'Event/foo', payload: {} });

      expect(fired.length).to.eql(2);
      expect(fired[0].type).to.eql('ANY');
      expect(fired[1].type).to.eql('Event/foo');
    });

    it('create: use given bus', () => {
      const bus1 = RxBus();
      const bus2 = RxBus(bus1);
      expect(bus2).to.equal(bus1);
    });

    it('filters out non-standard [event] objects from the stream', () => {
      const source$ = new Rx.Subject<any>();
      const bus = RxBus<MyEvent>(source$);

      const fired: MyEvent[] = [];
      bus.$.subscribe((e) => fired.push(e));

      // NB: All data-types that do not conform to the shape of a [Event].
      source$.next(undefined);
      source$.next(null);
      source$.next(1);
      source$.next(true);
      source$.next('two');
      source$.next({});
      source$.next({ type: 123, payload: {} });
      source$.next({ type: 'FOO' });
      source$.next({ type: 'FOO', payload: 123 });

      expect(fired.length).to.eql(0);
    });
  });

  describe('bus.connect', () => {
    type E = t.Event;

    it('connect: async', async () => {
      const a = RxBus();
      const b = RxBus();
      const conn = RxBus.connect([a, b]);
      expect(conn.buses).to.eql([a, b]);

      const firedA: E[] = [];
      const firedB: E[] = [];
      a.$.subscribe((e) => firedA.push(e));
      b.$.subscribe((e) => firedB.push(e));

      const event: E = { type: 'foo', payload: { count: 123 } };
      a.fire(event);

      expect(firedA).to.eql([event]);
      expect(firedB).to.eql([]);

      await Time.wait(10);
      expect(firedA).to.eql([event]);
      expect(firedB).to.eql([event]);
    });

    it('connect: sync', () => {
      const a = RxBus();
      const b = RxBus();
      const conn = RxBus.connect([a, b], { async: false });
      expect(conn.buses).to.eql([a, b]);

      const firedA: E[] = [];
      const firedB: E[] = [];
      a.$.subscribe((e) => firedA.push(e));
      b.$.subscribe((e) => firedB.push(e));

      const event: E = { type: 'foo', payload: { count: 123 } };
      a.fire(event);

      expect(firedA).to.eql([event]);
      expect(firedB).to.eql([event]);
    });
  });
});
