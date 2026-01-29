import { describe, expect, it, type t } from '../../-test.ts';
import { EffectController } from '../mod.ts';
import { createFakeRef } from './u.fixture.ts';

type State = { count?: number; name?: string };

describe('EffectController', () => {
  const create = (initial: State = {}) => {
    const ref = createFakeRef<State>(initial);
    return EffectController.create<State>({ ref });
  };

  describe('create', () => {
    it('returns controller with id and lifecycle', () => {
      const ctrl = create();

      expect(ctrl.id).to.include('EffectController-');
      expect(ctrl.disposed).to.eql(false);

      ctrl.dispose();
      expect(ctrl.disposed).to.eql(true);
    });

    it('accepts custom id', () => {
      const ref = createFakeRef<State>({});
      const ctrl = EffectController.create<State>({ id: 'my-ctrl', ref });

      expect(ctrl.id).to.eql('my-ctrl');
      ctrl.dispose();
    });

    it('generates unique ids', () => {
      const a = create();
      const b = create();

      expect(a.id).to.not.eql(b.id);

      a.dispose();
      b.dispose();
    });

    it('does not expose props when not configured', () => {
      const ctrl = EffectController.create<State>({ ref: createFakeRef<State>({}) });
      expect('props' in ctrl).to.eql(false);
      ctrl.dispose();
    });

    it('exposes props when provided', () => {
      const props = { baseUrl: 'http://test' as t.StringUrl } as const;
      const ctrl = EffectController.create<State, typeof props>({
        ref: createFakeRef<State>({}),
        props,
      });

      expect('props' in ctrl).to.eql(true);
      expect(ctrl.props).to.equal(props);
      expect(ctrl.props.baseUrl).to.eql(props.baseUrl);

      ctrl.dispose();
    });
  });

  describe('current / next / rev', () => {
    it('starts with initial state and rev 0', () => {
      const ctrl = create({ count: 42 });

      expect(ctrl.current()).to.eql({ count: 42 });
      expect(ctrl.rev).to.eql(0);

      ctrl.dispose();
    });

    it('next() updates state and increments rev', () => {
      const ctrl = create();

      ctrl.next({ count: 1 });
      expect(ctrl.current().count).to.eql(1);
      expect(ctrl.rev).to.eql(1);

      ctrl.next({ name: 'test' });
      expect(ctrl.current()).to.eql({ count: 1, name: 'test' });
      expect(ctrl.rev).to.eql(2);

      ctrl.dispose();
    });

    it('next() with no-op does not bump rev', () => {
      const ctrl = create({ count: 1 });

      ctrl.next({ count: 1 }); // Same value.
      expect(ctrl.rev).to.eql(0);

      ctrl.next({}); // Empty patch.
      expect(ctrl.rev).to.eql(0);

      ctrl.dispose();
    });

    it('next() ignored after dispose', () => {
      const ctrl = create();

      ctrl.next({ count: 1 });
      expect(ctrl.rev).to.eql(1);

      ctrl.dispose();

      ctrl.next({ count: 2 });
      expect(ctrl.rev).to.eql(1);
      expect(ctrl.current().count).to.eql(1);
    });
  });

  describe('onChange', () => {
    it('fires on state change', () => {
      const ctrl = create();
      const fired: State[] = [];

      ctrl.onChange((state) => fired.push(state));

      ctrl.next({ count: 1 });
      expect(fired.length).to.eql(1);
      expect(fired[0]).to.eql({ count: 1 });

      ctrl.dispose();
    });

    it('does not fire on no-op', () => {
      const ctrl = create({ count: 1 });
      const fired: State[] = [];

      ctrl.onChange((state) => fired.push(state));

      ctrl.next({ count: 1 }); // Same value.
      expect(fired.length).to.eql(0);

      ctrl.dispose();
    });

    it('unsubscribe stops notifications', () => {
      const ctrl = create();
      const fired: State[] = [];

      const unsub = ctrl.onChange((state) => fired.push(state));

      ctrl.next({ count: 1 });
      expect(fired.length).to.eql(1);

      unsub();

      ctrl.next({ count: 2 });
      expect(fired.length).to.eql(1);

      ctrl.dispose();
    });

    it('onChange after dispose returns noop unsub', () => {
      const ctrl = create();
      ctrl.dispose();

      const unsub = ctrl.onChange(() => {});
      expect(typeof unsub).to.eql('function');
      unsub(); // Should not throw.
    });
  });
});
