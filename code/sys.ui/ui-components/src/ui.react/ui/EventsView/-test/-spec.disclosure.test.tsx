import { cloneElement, useEffect, useReducer } from 'react';
import { within } from '@testing-library/react';
import { act, describe, DomMock, expect, it, specimenFixture, TestReact } from '../../../-test.ts';
import { D } from '../common.ts';
import type { DebugSignals } from '../-spec/-SPEC.Debug.tsx';

describe('EventsView specimen: disclosure ownership', () => {
  it('switches owners without copying values; label and count both update the host control', async () => {
    await using fixture = await specimenFixture<DebugSignals>(
      `dev:${D.displayName}`,
      () => import('../-spec/-SPEC.tsx'),
    );
    const { host, debug } = fixture;
    const { Debug } = await import('../-spec/-SPEC.Debug.tsx');
    const root = await host.subject();

    // Mount the real subject and honor its attached harness redraw requests.
    function Subject() {
      const [, redraw] = useReducer((n: number) => n + 1, 0);
      useEffect(() => {
        const sub = host.controller.redraw.$.subscribe(() => redraw());
        return () => sub.unsubscribe();
      }, []);
      return cloneElement(root);
    }
    using res = await TestReact.render(
      <>
        <Subject />
        <Debug debug={debug} />
      </>,
    );
    const view = within(res.container);
    const control = (name: string) => view.getByRole('button', { name });
    const click = (name: string) => act(async () => control(name).click());
    const label = () => control('events');
    await click('events');
    expect(label().getAttribute('aria-expanded')).to.eql('true');
    await click('disclosure owner: component (useState)');
    expect(label().getAttribute('aria-expanded')).to.eql('false');
    await click('host expanded: false');
    expect(label().getAttribute('aria-expanded')).to.eql('true');
    await click('events');
    await click('host expanded: false');
    const number = new Intl.NumberFormat();
    const count = control(`${number.format(5)} of ${number.format(1000)}`);
    await act(async () => {
      count.focus();
      count.dispatchEvent(DomMock.Keyboard.keydownEvent('Enter', { bubbles: true }));
      count.dispatchEvent(DomMock.Keyboard.keyupEvent('Enter', { bubbles: true }));
    });
    await click('host expanded: false');
    await click('disclosure owner: host (dev-harness)');
    expect(label().getAttribute('aria-expanded')).to.eql('false');
    expect(view.queryByRole('button', { name: 'host expanded: true' })).to.eql(null);
    await click('disclosure owner: component (useState)');
    expect(label().getAttribute('aria-expanded')).to.eql('true');
  });
});
