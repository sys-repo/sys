import * as Preact from '@preact/signals-react';
import { useState } from 'react';

import { describe, expect, it, Testing, Time } from '../-test.ts';
import { TestReact } from '../m.Testing.Server/mod.ts';
import { Signal } from './mod.ts';

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

  describe('useRedrawEffect', () => {
    it('coalesces redraws per microtask', async () => {
      let renders = 0;

      function TestComponent() {
        const count = Signal.useSignal(0);
        const [, setRender] = useState(0); // keep a state so redraws are real

        // Establish dependency + coalesced redraw
        Signal.useRedrawEffect(() => {
          count.value; // touch to establish dependency
        });

        // Count renders
        renders++;

        const bump3 = () => {
          // three updates in the same tick
          count.value += 1;
          count.value += 1;
          count.value += 1;
        };

        return (
          <div>
            <button onClick={bump3}>Bump3</button>
            <span data-count>{count.value}</span>
            <span data-renders>{renders}</span>
          </div>
        );
      }

      const dom = await TestReact.render(<TestComponent />);

      // initial paint
      await Testing.wait();
      const btn = dom.container.querySelector('button')!;
      const countEl = dom.container.querySelector('[data-count]')!;
      const rendersEl = dom.container.querySelector('[data-renders]')!;

      // baseline assertions
      expect(countEl.textContent).to.equal('0');
      const rendersBefore = Number(rendersEl.textContent);

      // trigger 3 updates in the same tick
      btn.click();

      // before microtask flush: coalescer hasn't fired, UI unchanged
      expect(countEl.textContent).to.equal('0');

      // after redraw: count reflects 3 updates; render delta is 1–2 (StrictMode tolerant)
      await Testing.until(() => countEl.textContent === '3');
      const rendersAfterFirst = Number(rendersEl.textContent);
      expect(rendersAfterFirst - rendersBefore)
        .to.be.gte(1)
        .and.to.be.lte(2);

      // do another burst; exactly one more coalesced redraw (again allow 1–2)
      btn.click();
      await Testing.until(() => countEl.textContent === '6');
      const rendersAfterSecond = Number(rendersEl.textContent);
      expect(rendersAfterSecond - rendersAfterFirst)
        .to.be.gte(1)
        .and.to.be.lte(2);

      dom.dispose();
    });
  });
});
