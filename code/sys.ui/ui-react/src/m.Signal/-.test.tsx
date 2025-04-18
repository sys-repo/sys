import React, { useState } from 'react';

import { describe, expect, it, Testing, Time } from '../-test.ts';
import { TestReact } from '../m.Testing.Server/mod.ts';
import { Signal } from './mod.ts';

import * as Preact from '@preact/signals-react';

/**
 * See [@sys/std/signal] unit tests for basic API
 * usage sceanrios:
 *
 *    • signal     ← (update)
 *    • effect     ← (listen and react to change)
 *    • computed   ← (compound signal value)
 *    • batch      ← (multiple changes, single fire of effect listeners)
 *
 */
describe('Signals', { sanitizeOps: false, sanitizeResources: false }, () => {
  it('API', () => {
    expect(Signal.create).to.equal(Preact.signal);
    expect(Signal.effect).to.equal(Preact.effect);
    expect(Signal.useSignal).to.equal(Preact.useSignal);
    expect(Signal.useEffect).to.equal(Preact.useSignalEffect);
  });

  describe('React hooks', () => {
    it('useSignal | useSignalEffect', async () => {
      let fired: number[] = [];

      /**
       * Render: into a DOM container.
       */
      function TestComponent() {
        const count = Signal.useSignal(0);

        const [, setRender] = useState(0);
        const redraw = () => setRender((n) => n + 1);

        // Runs whenever `count.value` changes.
        Signal.useEffect(() => {
          fired.push(count.value);
          redraw();
        });

        const increment = () => (count.value += 1);
        return (
          <div>
            <button onClick={increment}>Increment</button>
            <span>{count.value}</span>
          </div>
        );
      }

      const dom = await TestReact.render(<TestComponent />);
      await Time.wait(10);

      /**
       * Verify initial state.
       */
      const button = dom.container.querySelector('button')!;
      const span = dom.container.querySelector('span')!;
      expect(span.textContent).to.eql('0');
      expect(fired).to.eql([0, 0]); // NB: initial render(s).

      /**
       * Simulate a user click, then wait a microtask so React re-renders.
       */
      fired = []; // ← (clear before test).
      button.click();
      button.click();
      button.click();
      await Testing.wait();

      expect(fired).to.eql([1, 2, 3]);
      expect(span.textContent).to.equal('3');

      dom.dispose();
    });
  });
});
