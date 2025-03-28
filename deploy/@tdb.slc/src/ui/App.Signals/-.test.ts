import { type t, c, describe, expect, it } from '../../-test.ts';
import { App, VIDEO } from './mod.ts';

describe('App', () => {
  describe('App.signals', () => {
    it('create', () => {
      const app = App.signals();
      const p = app.props;

      expect(typeof app.video.play === 'function').to.eql(true);

      expect(p.theme.value === 'Dark').to.be.true;
      expect(p.dist.value).to.eql(undefined);
      expect(p.content.value).to.eql(undefined);
      expect(p.theme.value).to.eql('Dark');
      expect(p.background.video.opacity.value).to.eql(0.2);

      console.info();
      console.info(c.brightGreen('SLC:App.Signals:'));
      console.info(app);
      console.info();
    });

    it('method: load', () => {
      const content: t.AppContent = { id: 'foo', video: { src: VIDEO.GroupScale.src } };
      const app = App.signals();
      expect(app.props.content.value).to.eql(undefined);
      app.load(content);
      expect(app.props.content.value).to.eql(content);
      app.load();
      expect(app.props.content.value).to.eql(undefined);
    });

    describe('syncing', () => {
      it('player [video.src] sync on content changes', () => {
        const signals = App.signals();
        const p = signals.props;
        const getSrc = () => signals.video.props.src.value;

        expect(p.content.value).to.eql(undefined);
        expect(getSrc()).to.eql(undefined);

        p.content.value = { id: 'foo', video: { src: VIDEO.GroupScale.src } };
        expect(getSrc()).to.eql(VIDEO.GroupScale.src);

        p.content.value = undefined;
        expect(getSrc()).to.eql(undefined);
      });
    });
  });
});
