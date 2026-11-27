import { within } from '@testing-library/react';
import { Anchor } from '@sys/ui-components/react/anchor';
import type * as t from '@sys/ui-components/t';
import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  TestReact,
} from '../../../-test.ts';

const { Button } = Anchor;

describe('Anchor.Button', () => {
  DomMock.init({ beforeAll, afterAll });

  it('public button props require an action and do not accept a destination', () => {
    const onClick = () => {};
    expectTypeOf({ children: 'Details', onClick }).toMatchTypeOf<t.Anchor.Button.Props>();
    // @ts-expect-error The callback is required.
    void <Button>Details</Button>;
    // @ts-expect-error Use Anchor.Link for a destination.
    void <Button href='/docs' onClick={onClick}>Docs</Button>;
  });

  it('native button → delivers one click without submitting its form', async () => {
    let submits = 0;
    const targets: HTMLButtonElement[] = [];
    let disabledCalls = 0;
    const wider = { type: 'submit', href: '/docs' };
    using res = await TestReact.render(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submits++;
        }}
      >
        <Button
          {...wider}
          aria-expanded={false}
          aria-controls='details'
          onClick={(e) => {
            expectTypeOf(e.currentTarget).toEqualTypeOf<EventTarget & HTMLButtonElement>();
            targets.push(e.currentTarget);
          }}
        >
          Details
        </Button>
        <Button enabled={false} onClick={() => disabledCalls++}>Unavailable</Button>
        <div id='details' hidden>More detail</div>
      </form>,
    );
    const view = within(res.container);
    const button = view.getByRole<HTMLButtonElement>('button', { name: 'Details' });
    const disabled = view.getByRole<HTMLButtonElement>('button', { name: 'Unavailable' });
    expect(button.tagName).to.eql('BUTTON');
    expect(button.type).to.eql('button');
    expect(button.hasAttribute('href')).to.eql(false);
    expect(button.getAttribute('aria-expanded')).to.eql('false');
    expect(button.getAttribute('aria-controls')).to.eql('details');
    expect(disabled.disabled).to.eql(true);
    act(() => {
      button.click();
      disabled.click();
    });
    expect(targets.length).to.eql(1);
    expect(targets[0]).to.equal(button);
    expect(disabledCalls).to.eql(0);
    expect(submits).to.eql(0);
  });

  it('icon-only buttons retain caller-owned accessible names', async () => {
    const onClick = () => {};
    const icon = <svg aria-hidden='true' />;
    using res = await TestReact.render(
      <>
        <Button aria-label='Show details' onClick={onClick}>{icon}</Button>
        <span id='dismiss-label'>Dismiss details</span>
        <Button aria-labelledby='dismiss-label' onClick={onClick}>{icon}</Button>
      </>,
    );
    const view = within(res.container);
    view.getByRole('button', { name: 'Show details' });
    view.getByRole('button', { name: 'Dismiss details' });
  });
});
