import { useState } from 'react';

import { describe, expect, it, Testing } from '../../-test.ts';
import { TestReact } from '../../m.Testing.Server/mod.ts';
import { Signal } from '../mod.ts';

describe('Signal.useRedrawEffect | ', () => {
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
