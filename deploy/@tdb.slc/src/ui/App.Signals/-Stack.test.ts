import { type t, describe, expect, it, Signal } from '../../-test.ts';
import { VIDEO } from '../App.Content/mod.ts';
import { AppSignals } from './mod.ts';

describe('AppSignals.stack', () => {
  const a: t.Content = { id: 'a' };
  const b: t.Content = { id: 'b' };
  const c: t.Content = { id: 'b' };

  it('empty by default', () => {
    const app = AppSignals.create();
    expect(app.props.stack.value).to.eql([]);
    expect(app.stack.length).to.eql(0);
    expect(app.stack.items).to.eql([]);
    expect(app.stack.items).to.not.equal(app.props.stack.value); // NB: cloned array - protect from mutation.
  });

  describe('method: push', () => {
    it('push (1) - triggers signal effect', () => {
      const app = AppSignals.create();
      const fired: number[] = [];
      Signal.effect(() => {
        fired.push(app.props.stack.value.length);
      });

      expect(app.stack.length).to.eql(0);
      app.stack.push(a);
      expect(app.stack.length).to.eql(1);
      expect(app.props.stack.value).to.eql([a]);
      expect(fired).to.eql([0, 1]);

      app.stack.push(b);
      expect(app.stack.length).to.eql(2);
      expect(app.props.stack.value).to.eql([a, b]);
      expect(fired).to.eql([0, 1, 2]);
    });

    it('push (many)', () => {
      const app = AppSignals.create();
      const fired: number[] = [];
      Signal.effect(() => {
        fired.push(app.props.stack.value.length);
      });

      app.stack.push(a);
      expect(app.stack.length).to.eql(1);
      expect(fired).to.eql([0, 1]);

      app.stack.push(b, c);
      expect(app.stack.length).to.eql(3);
      expect(app.props.stack.value).to.eql([a, b, c]);
      expect(fired).to.eql([0, 1, 3]);
    });

    it('push <undefined>', () => {
      const app = AppSignals.create();
      app.stack.push();
      app.stack.push(undefined, a, undefined, b);
      expect(app.stack.length).to.eql(2);
      expect(app.props.stack.value).to.eql([a, b]);
    });
  });

  describe('method: clear', () => {
    it('clear all', () => {
      const app = AppSignals.create();
      const fired: number[] = [];
      Signal.effect(() => {
        fired.push(app.props.stack.value.length);
      });

      app.stack.push(a, b);
      expect(app.props.stack.value).to.eql([a, b]);
      expect(fired).to.eql([0, 2]);
      expect(app.stack.length).to.eql(2);

      app.stack.clear();
      expect(fired).to.eql([0, 2, 0]);
      expect(app.stack.length).to.eql(0);
    });

    it('clear( leave )', () => {
      const test = (leave: number) => {
        const app = AppSignals.create();
        app.stack.push(a, b, c);
        expect(app.stack.length).to.eql(3);

        app.stack.clear(leave);
        expect(app.stack.length).to.eql(leave);
      };
      test(0);
      test(1);
      test(2);
    });
  });

  describe('method: pop', () => {
    it('pop: removes top most layer', () => {
      const app = AppSignals.create();
      const fired: number[] = [];
      Signal.effect(() => {
        fired.push(app.props.stack.value.length);
      });

      app.stack.push(a, b, c);
      expect(fired).to.eql([0, 3]);

      app.stack.pop();
      expect(fired).to.eql([0, 3, 2]);
      expect(app.props.stack.value).to.eql([a, b]);

      app.stack.pop();
      app.stack.pop();
      expect(fired).to.eql([0, 3, 2, 1, 0]);
      expect(app.props.stack.value).to.eql([]);

      app.stack.pop(); // NB: ← already empty at this point.
      expect(app.props.stack.value).to.eql([]);

      expect(fired.length).to.eql(5);
      app.stack.pop();
      app.stack.pop();
      expect(fired.length).to.eql(5); // NB: no change (already empty).
    });

    it('pop( leave ) ← retain minimum level', () => {
      const app = AppSignals.create();
      app.stack.push(a, b, c);
      expect(app.stack.length).to.eql(3);

      app.stack.pop(3);
      app.stack.pop(3);
      expect(app.stack.length).to.eql(3);

      app.stack.pop();
      expect(app.stack.length).to.eql(2);

      app.stack.pop(1);
      app.stack.pop(1);
      app.stack.pop(1);
      expect(app.stack.length).to.eql(1);

      app.stack.pop(-1);
      expect(app.stack.length).to.eql(0);
      app.stack.pop(-1);
      app.stack.pop(-1);
      expect(app.stack.length).to.eql(0);
    });

    it('adds/removes corresponding <Video.Player> signals to {players} object', () => {
      const app = AppSignals.create();
      const p = app.props;
      expect(p.players).to.eql({});

      // Add: push a layer with a video to the stack.
      app.stack.push({ id: 'foo' });
      app.stack.push({ id: 'bar.baz', video: { src: VIDEO.GroupScale.src } });

      expect(typeof p.players['bar.baz.1'].play === 'function').to.be.true;

      // Remove: pop the video layer off the stack.
      expect(Object.keys(p.players).length).to.eql(1);
      app.stack.pop();
      expect(p.players).to.eql({});
    });

    it('retains <Player> object on layer state after .push() → .pop() over it', () => {
      const app = AppSignals.create();
      app.stack.push({ id: 'foo-0' });
      app.stack.push({ id: 'foo-1', video: { src: VIDEO.GroupScale.src } });

      const fromLayer1 = () => AppSignals.Player.find(app, 'foo-1', 1);
      const a = fromLayer1();
      expect(a).to.equal(fromLayer1()); // NB: assert test helpers working as expected.

      app.stack.push({ id: 'foo-2' });
      const b = fromLayer1();

      app.stack.pop();
      const c = fromLayer1();

      [a, b, c].forEach((v) => expect(v?.play).to.be.a('function')); // All are players.
      expect(b).to.equal(a);
      expect(c).to.equal(a);
    });
  });
});
