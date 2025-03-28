import { type t, Signal, c, describe, expect, it } from '../../-test.ts';
import { VIDEO } from './common.ts';
import { App } from './mod.ts';

describe('App', () => {
  describe('App.signals', () => {
    it('create', () => {
      const app = App.signals();
      const p = app.props;

      expect(typeof app.video.play === 'function').to.eql(true);

      expect(p.dist.value).to.eql(undefined);
      expect(p.breakpoint.value).to.eql('UNKNOWN');
      expect(p.background.video.opacity.value).to.eql(0.2);
      expect(p.background.video.src.value).to.eql(VIDEO.Tubes.src);
      expect(p.stack.value).to.eql([]);

      console.info();
      console.info(c.brightGreen('SLC:App.Signals:'));
      console.info(app);
      console.info();
    });

    describe('stack methods', () => {
      const a: t.AppContent = { id: 'a' };
      const b: t.AppContent = { id: 'b' };
      const c: t.AppContent = { id: 'b' };

      it('empty by default', () => {
        const app = App.signals();
        expect(app.props.stack.value).to.eql([]);
        expect(app.stack.length).to.eql(0);
        expect(app.stack.items).to.eql([]);
        expect(app.stack.items).to.not.equal(app.props.stack.value); // NB: cloned array - protect from mutation.
      });

      it('method: push (1) - triggers signal effect', () => {
        const app = App.signals();
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

      it('method: push (many)', () => {
        const app = App.signals();
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

      it('method: push undefined', () => {
        const app = App.signals();
        app.stack.push();
        app.stack.push(undefined, a, undefined, b);
        expect(app.stack.length).to.eql(2);
        expect(app.props.stack.value).to.eql([a, b]);
      });

      it('method: clear', () => {
        const app = App.signals();
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

      it('method: pop', () => {
        const app = App.signals();
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
        expect(fired).to.eql([0, 3, 2, 1, 0, 0]);
        expect(app.props.stack.value).to.eql([]);
      });
    });
  });
});
