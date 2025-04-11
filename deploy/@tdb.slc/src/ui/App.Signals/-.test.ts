import { c, describe, expect, it, rx, Signal } from '../../-test.ts';
import { VIDEO } from '../../ui.Content/VIDEO.ts';
import { AppSignals } from './mod.ts';

describe('AppSignals', () => {
  describe('lifecycle', () => {
    it('create', () => {
      const app = AppSignals.create();
      const p = app.props;

      expect(p.dist.value).to.eql(undefined);
      expect(p.screen.breakpoint.value).to.eql('UNKNOWN');
      expect(p.background.video.opacity.value).to.eql(0.2);
      expect(p.background.video.src.value).to.eql(VIDEO.Tubes.src);
      expect(p.background.video.playing.value).to.eql(true);
      expect(p.stack.value).to.eql([]);
      expect(p.screen.breakpoint.value).to.eql(app.breakpoint.name);

      console.info();
      console.info(c.brightGreen('SLC:App.Signals:'));
      console.info(app);
      console.info();

      app.dispose();
    });

    it('dispose', () => {
      const life = rx.disposable();
      const a = AppSignals.create();
      const b = AppSignals.create(life.dispose$);
      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(false);

      life.dispose();
      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(true);

      a.dispose();
      expect(a.disposed).to.eql(true);
      expect(b.disposed).to.eql(true);
    });
  });

  describe('App.listen', () => {
    it('listens to changes', () => {
      const app = AppSignals.create();

      let count = 0;
      Signal.effect(() => {
        app.listen();
        count++;
      });

      expect(count).to.eql(1);
      app.stack.push({ id: 'foo' });
      expect(count).to.eql(2);

      app.dispose();
    });
  });
});
