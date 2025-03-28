import { describe, expect, it } from '../../-test.ts';
import { App } from './mod.ts';

describe('App', () => {
  describe('App.signals', () => {
    it('create', () => {
      const signals = App.signals();
      const p = signals.props;

      expect(typeof signals.video.play === 'function').to.eql(true);

      expect(p.stage.value === 'Entry').to.be.true;
      expect(p.theme.value === 'Dark').to.be.true;
      expect(p.dist.value).to.eql(undefined);
      expect(p.background.video.opacity.value).to.eql(0.2);

      console.info();
      console.info('SLC:App.Signals:\n', signals);
      console.info();
    });
  });
});
