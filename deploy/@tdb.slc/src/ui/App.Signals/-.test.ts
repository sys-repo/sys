import { describe, expect, it, c } from '../../-test.ts';
import { App, VIDEO } from './mod.ts';

describe('App', () => {
  describe('App.signals', () => {
    it('create', () => {
      const signals = App.signals();
      const p = signals.props;

      expect(typeof signals.video.play === 'function').to.eql(true);

      expect(p.stage.value === 'Entry').to.be.true;
      expect(p.theme.value === 'Dark').to.be.true;
      expect(p.dist.value).to.eql(undefined);
      expect(p.content.value).to.eql(undefined);
      expect(p.background.video.opacity.value).to.eql(0.2);

      console.info();
      console.info(c.brightGreen('SLC:App.Signals:'));
      console.info(signals);
      console.info();
    });

    describe('syncing (state integrity)', () => {
      it('syncs player [video.src] with content changes', () => {
        const signals = App.signals();
        const p = signals.props;
        expect(p.content.value).to.eql(undefined);

        const getSrc = () => signals.video.props.src.value;
        expect(getSrc()).to.eql(undefined);

        p.content.value = { id: 'foo', video: { src: VIDEO.GroupScale.src } };
        expect(getSrc()).to.eql(VIDEO.GroupScale.src);

        p.content.value = undefined;
        expect(getSrc()).to.eql(undefined);
      });
    });
  });
});
