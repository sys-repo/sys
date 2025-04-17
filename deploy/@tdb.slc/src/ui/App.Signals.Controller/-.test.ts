import { describe, expect, it, rx } from '../../-test.ts';
import { AppSignals } from '../App.Signals/mod.ts';

describe('AppSignals.Controllers', () => {
  describe('start', () => {
    it('should add all children', () => {
      const state = AppSignals.create();

      const root = AppSignals.Controllers.start(state);
      expect(root.disposed).to.eql(false);
      expect(root.id).to.eql('Controller:App');

      expect(root.children.map(({ id }) => id)).to.eql(['Controller:App:Background']);
      root.children.forEach((child) => expect(child.disposed).to.eql(false));

      root.dispose();
      expect(root.disposed).to.eql(true);
      root.children.forEach((child) => expect(child.disposed).to.eql(true));
    });
  });

  describe('background', () => {
    it('adjusts backbround blur when stack changes', () => {
      const life = rx.disposable();
      const state = AppSignals.create();
      const p = state.props;
      expect(p.background.video.blur.value).to.eql(0);

      const ctrl = AppSignals.Controllers.background(state, life);
      expect(ctrl.disposed).to.eql(false);
      expect(ctrl.id).to.eql('Controller:App:Background');
      expect(ctrl.children).to.eql([]);

      // Add to the stack.
      state.stack.push({ id: 'base' });
      expect(p.background.video.blur.value).to.eql(0); // NB: no change.

      state.stack.push({ id: 'one' });
      expect(p.background.video.blur.value).to.eql(20); // NB: no change.

      state.stack.clear();
      expect(p.background.video.blur.value).to.eql(0);

      life.dispose();
      expect(ctrl.disposed).to.eql(true);

      state.stack.push({ id: 'one' }, { id: 'two' });
      expect(p.background.video.blur.value).to.eql(0); // NB: no change - disposed.
    });
  });
});
