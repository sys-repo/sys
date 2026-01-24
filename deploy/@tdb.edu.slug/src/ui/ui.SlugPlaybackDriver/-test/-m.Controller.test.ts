import { describe, expect, it } from '../../../-test.ts';
import { SlugPlaybackDriver } from '../mod.ts';

describe('SlugPlaybackDriver.Controller', () => {
  const baseUrl = 'http://test';
  const create = () => SlugPlaybackDriver.Controller.create({ baseUrl });

  describe('create', () => {
    it('returns controller with id and lifecycle', () => {
      const ctrl = create();

      expect(ctrl.id).to.include('slug-playback-');
      expect(ctrl.disposed).to.eql(false);
      expect(typeof ctrl.dispose).to.eql('function');

      ctrl.dispose();
      expect(ctrl.disposed).to.eql(true);
    });

    it('generates unique ids', () => {
      const a = create();
      const b = create();

      expect(a.id).to.not.eql(b.id);

      a.dispose();
      b.dispose();
    });
  });

  describe('current / next / rev', () => {
    it('starts with empty state and rev 0', () => {
      const ctrl = create();
      expect(ctrl.current()).to.eql({});
      expect(ctrl.rev).to.eql(0);

      ctrl.dispose();
    });

    it('next() updates state and increments rev', () => {
      const ctrl = create();
      const path = ['a'];

      ctrl.next({ selectedPath: path });
      expect(ctrl.current().selectedPath).to.eql(['a']);
      expect(ctrl.rev).to.eql(1);

      ctrl.next({ isLoading: true });
      expect(ctrl.current().isLoading).to.eql(true);
      expect(ctrl.current().selectedPath).to.eql(['a']);
      expect(ctrl.rev).to.eql(2);

      ctrl.dispose();
    });

    it('next() with same reference does not bump rev', () => {
      const ctrl = create();
      const path = ['a'];

      ctrl.next({ selectedPath: path });
      expect(ctrl.rev).to.eql(1);

      ctrl.next({ selectedPath: path }); // Same reference.
      expect(ctrl.rev).to.eql(1);

      ctrl.next({});
      expect(ctrl.rev).to.eql(1);

      ctrl.dispose();
    });

    it('next() ignored after dispose', () => {
      const ctrl = create();
      const path = ['a'];

      ctrl.next({ selectedPath: path });
      expect(ctrl.rev).to.eql(1);

      ctrl.dispose();

      ctrl.next({ selectedPath: ['b'] });
      expect(ctrl.rev).to.eql(1);
      expect(ctrl.current().selectedPath).to.eql(['a']);
    });
  });

  describe('onChange', () => {
    it('fires on state change', () => {
      const ctrl = create();
      const fired: unknown[] = [];

      ctrl.onChange((state) => fired.push(state));
      expect(fired.length).to.eql(0);

      ctrl.next({ selectedPath: ['a'] });
      expect(fired.length).to.eql(1);
      expect(fired[0]).to.eql({ selectedPath: ['a'] });

      ctrl.dispose();
    });

    it('does not fire when no change (same reference)', () => {
      const ctrl = create();
      const fired: unknown[] = [];
      const path = ['a'];

      ctrl.next({ selectedPath: path });
      ctrl.onChange((state) => fired.push(state));

      ctrl.next({ selectedPath: path }); // Same reference.
      expect(fired.length).to.eql(0);

      ctrl.dispose();
    });

    it('unsubscribe stops notifications', () => {
      const ctrl = create();
      const fired: unknown[] = [];

      const unsub = ctrl.onChange((state) => fired.push(state));

      ctrl.next({ selectedPath: ['a'] });
      expect(fired.length).to.eql(1);

      unsub();

      ctrl.next({ selectedPath: ['b'] });
      expect(fired.length).to.eql(1);

      ctrl.dispose();
    });

    it('onChange after dispose is noop and safe', () => {
      const ctrl = create();
      const fired: unknown[] = [];

      ctrl.dispose();

      const unsub = ctrl.onChange(() => fired.push(1));
      expect(typeof unsub).to.eql('function');

      unsub();
      unsub();

      ctrl.next({ selectedPath: ['a'] });
      expect(ctrl.rev).to.eql(0);
      expect(fired.length).to.eql(0);
    });
  });
});
