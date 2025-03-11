import { type t, describe, expect, it, slug } from '../-test.ts';
import { single } from 'rxjs';
import { Immutable } from './mod.ts';

describe('T:Immutable', () => {
  /**
   * Types:
   */
  type P = t.PatchOperation;

  type MyState = { tmp: number };
  type MyStateEvent = t.InferImmutableEvent<MyStateEvents>;
  type MyStateEvents = t.ImmutableEvents<MyState, P>;
  type MyStateImmutable = t.ImmutableRef<MyState, P, MyStateEvents>;

  /**
   * Sample implementation:
   */
  const DEFAULT_ID = `default:${slug()}`;
  let refs: Map<string, MyStateImmutable>;
  const reset = () => (refs = new Map<string, MyStateImmutable>());
  reset();

  const factory = (instanceId: string = DEFAULT_ID) => {
    if (refs.has(instanceId)) return refs.get(instanceId)!;

    const model = Immutable.clonerRef<MyState>({ tmp: 0 });
    refs.set(instanceId, model);
    return model;
  };

  const Store = {
    state: factory,
  };

  /**
   * State Factory (instantiation):
   */
  it('example type declaration: /t.ts', () => {
    const singleton = Store.state();
    const another = Store.state('something else');
    expect(singleton).to.equal(Store.state()); // NB: no-param → singleton factory.
    expect(singleton).to.not.equal(another);

    /**
     * Immutable change:
     */
    singleton.change((d) => d.tmp++);
    expect(singleton.current.tmp).to.eql(1);
    expect(another.current.tmp).to.eql(0);
  });

  describe('Store.state: (sample function)', () => {
    it('default (singleton)', () => {
      reset();
      const a = Store.state();
      const b = Store.state();
      expect(a).to.equal(b); // NB: same instance
    });

    it('custom: instance-id', () => {
      reset();
      const id = 'foo';
      const a = Store.state(id);
      const b = Store.state(id);
      const c = Store.state();
      const d = Store.state('something else');
      expect(a).to.equal(b); // NB: same instance
      expect(a).to.not.equal(c);
      expect(a).to.not.equal(d);
    });

    it('change', () => {
      reset();
      const a = Store.state();
      const b = Store.state();
      expect(a.current.tmp).to.eql(0);
      a.change((d) => d.tmp++);
      expect(b.current.tmp).to.eql(1);
    });

    it('shared events', () => {
      reset();
      const a = Store.state();
      const b = Store.state();
      const bEvents = a.events();
      const bFired: MyStateEvent[] = [];
      bEvents.changed$.pipe().subscribe((e) => bFired.push(e));

      a.change((d) => d.tmp++);
      expect(bFired[0].after).to.eql(a.current);
    });
  });
});
