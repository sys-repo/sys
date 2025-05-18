import { c, describe, expect, it, Signal } from '../../-test.ts';
import { VIDEO } from '../../ui.content/-VIDEO.ts';
import { AppSignals } from './mod.ts';

describe('AppSignals', () => {
  describe('lifecycle', () => {
    it('create', () => {
      const app = AppSignals.create();
      const p = app.props;

      expect(p.debug.value).to.eql(false);
      expect(p.dist.value).to.eql(undefined);
      expect(p.screen.breakpoint.value).to.eql('UNKNOWN');
      expect(p.stack.value).to.eql([]);
      expect(p.screen.breakpoint.value).to.eql(app.breakpoint.name);
      expect(p.controllers.listening.value).to.eql([]);

      expect(p.background.video.src.value).to.eql(VIDEO.Tubes.src);
      expect(p.background.video.playing.value).to.eql(true);
      expect(p.background.video.opacity.value).to.eql(0.2);
      expect(p.background.video.blur.value).to.eql(0);

      console.info();
      console.info(c.brightGreen('SLC:App.Signals:'));
      console.info(app);
      console.info();
    });

    it('instance id', () => {
      const a = AppSignals.create();
      const b = AppSignals.create();

      expect(a.instance.startsWith('app-')).to.eql(true);
      expect(a.instance.length).to.be.greaterThan('app-1ss9'.length);
      expect(a.instance).to.not.eql(b.instance);
    });
  });

  describe('listen', () => {
    it('listens to changes', () => {
      const app = AppSignals.create();

      let count = 0;
      const dispose = Signal.effect(() => {
        app.listen();
        count++;
      });

      expect(count).to.eql(1);
      app.stack.push({ id: 'foo' });
      expect(count).to.eql(2);

      dispose();
    });
  });
});
