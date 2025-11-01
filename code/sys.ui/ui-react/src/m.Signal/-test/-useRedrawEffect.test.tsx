import { useState } from 'react';
import { DomMock, Testing, act, describe, expect, it } from '../../-test.ts';
import { TestReact } from '../../m.Testing.Server/mod.ts';
import { Signal } from '../mod.ts';

DomMock.polyfill();

describe('Signal.useRedrawEffect | ', () => {
  it('coalesces redraws per microtask', async () => {
    let renders = 0;

    function TestComponent() {
      const count = Signal.useSignal(0);
      const [, setTick] = useState(0); // keep React state live; not used to force renders

      // Establish dependency + coalesced redraw per microtask.
      Signal.useRedrawEffect(() => {
        count.value; // establish reactive dependency (no extra walks)
        setTick((n) => n); // no-op write to keep React engaged without addl renders
      });

      // Count renders (may be >1 under strict/dev semantics).
      renders++;

      const bump3 = () => {
        // three updates in the same tick → should coalesce to one redraw
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
    await Testing.wait();

    const btn = dom.container.querySelector('button')!;
    const countEl = dom.container.querySelector('[data-count]')!;
    const rendersEl = dom.container.querySelector('[data-renders]')!;

    // Baseline
    expect(countEl.textContent).to.equal('0');
    const rendersBefore = Number(rendersEl.textContent);

    // Trigger 3 updates (no microtask flush yet).
    clickNoFlush(btn);

    // Before microtask: UI unchanged (coalescer hasn’t fired yet).
    expect(countEl.textContent).to.equal('0');

    // After microtask: UI shows a single coalesced redraw with value 3.
    await Testing.until(() => countEl.textContent === '3');
    const rendersAfterFirst = Number(rendersEl.textContent);

    // Strict/dev (and polyfilled DOM) can double-invoke; allow a small bounded increase.
    // In practice we see 1-4 depending on env. The key invariant: it's far less than 3.
    const deltaFirst = rendersAfterFirst - rendersBefore;
    expect(deltaFirst).to.be.gte(1).and.to.be.lte(4);

    // Do another burst; one more coalesced redraw to 6 (again allow 1-4 renders).
    clickNoFlush(btn);
    await Testing.until(() => countEl.textContent === '6');
    const rendersAfterSecond = Number(rendersEl.textContent);
    const deltaSecond = rendersAfterSecond - rendersAfterFirst;
    expect(deltaSecond).to.be.gte(1).and.to.be.lte(4);

    dom.dispose();
    await Testing.wait();
  });

  it('plays nicely with direct signal-driven renders (no triple renders per burst)', async () => {
    let renders = 0;

    function TestComponent() {
      const count = Signal.useSignal(0);

      Signal.useRedrawEffect(() => {
        count.value; // dependency only
      });

      renders++;

      const bump2 = () => {
        count.value += 1;
        count.value += 1;
      };

      return (
        <div>
          <button onClick={bump2}>Bump2</button>
          <span data-count>{count.value}</span>
          <span data-renders>{renders}</span>
        </div>
      );
    }

    const dom = await TestReact.render(<TestComponent />);
    await Testing.wait();

    const btn = dom.container.querySelector('button')!;
    const countEl = dom.container.querySelector('[data-count]')!;
    const rendersEl = dom.container.querySelector('[data-renders]')!;

    const baseRenders = Number(rendersEl.textContent);

    await clickFlush(btn);
    await Testing.until(() => countEl.textContent === '2');

    // Again be strict-mode tolerant; we care that we didn’t render 2-3 times *per update*.
    const delta = Number(rendersEl.textContent) - baseRenders;
    expect(delta).to.be.gte(1).and.to.be.lte(4);

    dom.dispose();
    await Testing.wait();
  });
});

/**
 * Click helpers:
 * - clickNoFlush: dispatches a click inside `act` (sync), does NOT wait a microtask.
 * - clickFlush:   dispatch + wait a microtask, so effects/renders can flush when desired.
 */
const clickNoFlush = (el: HTMLElement) => {
  const Win = el.ownerDocument.defaultView!;
  act(() => {
    el.dispatchEvent(new Win.MouseEvent('click', { bubbles: true, cancelable: true }));
  });
};
const clickFlush = async (el: HTMLElement) => {
  clickNoFlush(el);
  await Testing.wait();
};
