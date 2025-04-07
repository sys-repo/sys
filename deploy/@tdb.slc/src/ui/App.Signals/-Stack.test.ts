import { type t, describe, expect, it, Signal } from '../../-test.ts';
import { VIDEO } from '../App.Render/mod.ts';
import { AppSignals } from './mod.ts';

describe('AppSignals.stack', () => {
  const a: t.Content = { id: 'a' };
  const b: t.Content = { id: 'b' };
  const c: t.Content = { id: 'b' };

  /**
   * NOTE: stack more fully tested in ui/components:Sheet
   */
  it('push → pop → clear', () => {
    const app = AppSignals.create();
    const fired: number[] = [];
    Signal.effect(() => {
      fired.push(app.props.stack.value.length);
    });

    expect(app.stack.length).to.eql(0);

    // Push single.
    app.stack.push(a);
    expect(app.stack.length).to.eql(1);
    expect(app.props.stack.value).to.eql([a]);
    expect(fired).to.eql([0, 1]);

    // Push many.
    app.stack.push(b, c);
    expect(app.stack.length).to.eql(3);
    expect(app.props.stack.value).to.eql([a, b, c]);
    expect(fired).to.eql([0, 1, 3]);

    // Push <undefined>.
    app.stack.push();
    app.stack.push(undefined, a, undefined, b);
    expect(app.props.stack.value).to.eql([a, b, c, a, b]);

    app.stack.clear(1);
    expect(app.props.stack.value).to.eql([a]);

    app.stack.clear();
    expect(app.props.stack.value).to.eql([]);

    app.dispose();
  });

  describe('Video.Player syncing', () => {
    it('adds/removes corresponding <Video.Player> signals to {players} object', () => {
      const app = AppSignals.create();
      const p = app.props;
      expect(p.players).to.eql({});

      // Add: push a layer with a video to the stack.
      app.stack.push({ id: 'foo' });
      app.stack.push({ id: 'bar.baz', video: { src: VIDEO.GroupScale.src } });

      const key = AppSignals.Player.key('bar.baz', 1);
      expect(typeof p.players[key].play === 'function').to.be.true;

      // Remove: pop the video layer off the stack.
      expect(Object.keys(p.players).length).to.eql(1);
      app.stack.pop();
      expect(p.players).to.eql({});

      app.dispose();
    });

    it('retains <Player> object on layer state after .push() → .pop() over it', () => {
      const app = AppSignals.create();
      app.stack.push({ id: 'foo-0' });
      app.stack.push({ id: 'foo-1', video: { src: VIDEO.GroupScale.src } });

      const fromLayer = () => AppSignals.Player.find(app, 'foo-1', 1);
      const a = fromLayer();
      expect(a).to.equal(fromLayer()); // NB: assert test helpers working as expected.

      app.stack.push({ id: 'foo-2' });
      const b = fromLayer();

      app.stack.pop();
      const c = fromLayer();

      [a, b, c].forEach((v) => expect(v?.play).to.be.a('function')); // All are players.
      expect(b).to.equal(a);
      expect(c).to.equal(a);

      app.dispose();
    });

    it('stop syncing after dispose', () => {
      const app = AppSignals.create();
      app.stack.push({ id: 'foo', video: { src: 'vimeo/123' } });
      app.stack.push({ id: 'bar', video: { src: 'vimeo/456' } });

      expect(Object.keys(app.props.players).length).to.eql(2);
      app.stack.pop();
      expect(Object.keys(app.props.players).length).to.eql(1);

      app.dispose();
      app.stack.pop();
      expect(Object.keys(app.props.players).length).to.eql(1); // NB: no change.
    });
  });
});
