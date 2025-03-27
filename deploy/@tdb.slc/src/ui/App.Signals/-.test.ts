import { describe, expect, it } from '../../-test.ts';
import { App } from './mod.ts';

describe('App', () => {
  describe('App.signals', () => {
    it('create', () => {
      const signals = App.signals();
      expect(typeof signals.video.play === 'function').to.eql(true);

      expect(signals.stage.value === 'Entry').to.be.true;
      expect(signals.theme.value === 'Dark').to.be.true;
      expect(signals.dist.value).to.eql(undefined);
      expect(signals.background.video.opacity.value).to.eql(0.2);

      console.info();
      console.info('SLC:Signals:\n', signals);
      console.info();
    });
  });
});
