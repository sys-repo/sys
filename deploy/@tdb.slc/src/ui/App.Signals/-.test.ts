import { type t, c, describe, expect, it, rx, Signal } from '../../-test.ts';
import { VIDEO } from '../App.Content/mod.ts';
import { AppSignals } from './mod.ts';
import { Player } from './m.Player.ts';

describe('AppSignals', () => {
  it('API', () => {
    expect(AppSignals.Player).to.equal(Player);
  });

  describe('lifecycle', () => {
    it('create', () => {
      const app = AppSignals.create();
      const p = app.props;

      expect(p.dist.value).to.eql(undefined);
      expect(p.screen.breakpoint.value).to.eql('UNKNOWN');
      expect(p.background.video.opacity.value).to.eql(0.2);
      expect(p.background.video.src.value).to.eql(VIDEO.Tubes.src);
      expect(p.stack.value).to.eql([]);

      console.info();
      console.info(c.brightGreen('SLC:App.Signals:'));
      console.info(app);
      console.info();
    });

    it('dispose', () => {
      const life = rx.disposable();
      const a = AppSignals.create();
      const b = AppSignals.create(life.dispose$);
      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(false);

      const video = { src: 'foo' };
      const playerCount = (app: t.AppSignals) => Object.keys(app.props.players).length;
      const playerCounts = () => ({ a: playerCount(a), b: playerCount(b) });

      a.stack.push({ id: '1', video });
      expect(playerCounts()).to.eql({ a: 1, b: 0 });
      b.stack.push({ id: '1', video });
      expect(playerCounts()).to.eql({ a: 1, b: 1 });

      life.dispose();
      expect(a.disposed).to.eql(false);
      expect(b.disposed).to.eql(true);

      a.stack.push({ id: '2', video });
      b.stack.push({ id: '2', video }); // NB: now disposed - no increment.
      expect(playerCounts()).to.eql({ a: 2, b: 1 });

      a.dispose();
      expect(a.disposed).to.eql(true);
      expect(b.disposed).to.eql(true);

      a.stack.push({ id: '3', video }); // NB: now both disposed - no increment.
      b.stack.push({ id: '3', video });
      expect(playerCounts()).to.eql({ a: 2, b: 1 }); // NB: no change.
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
    });
  });
});
