import { type t, describe, expect, it, Signal } from '../../-test.ts';
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
    const dispose = Signal.effect(() => {
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

    dispose();
  });
});
