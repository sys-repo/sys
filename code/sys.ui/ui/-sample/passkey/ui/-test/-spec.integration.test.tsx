import React from 'react';
import { Harness } from '../../../-test.ui.ts';
import {
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  LocalStorage,
  STORAGE_KEY as VIEW_STORAGE,
  type t,
  TestReact,
  Time,
} from './common.ts';
import { transport } from '../../m.Account.Runtime/-test/u.fixture.ts';
import { SpecLinks } from '../-spec/-u.navigation.ts';
import { createDebugSignals } from '../-spec.integration/-SPEC.Debug.tsx';
import { STORAGE_KEY } from '../-spec.integration/common.ts';
import { createDebugSignals as createView } from '../-spec/-SPEC.Debug.tsx';

const initial = { theme: 'Dark', debug: false } as const;
type Preferences = Pick<t.Passkey.Props, 'theme' | 'debug'>;

describe('Passkey specimens', () => {
  DomMock.init({ beforeAll, afterAll });

  it('each specimen offers a same-tab link to the other', async () => {
    using _server = transport();
    const routes = [
      [(await import('../-spec.integration/-SPEC.tsx')).default, SpecLinks.view],
      [(await import('../-spec/-SPEC.tsx')).default, SpecLinks.sample],
    ] as const;
    for (const [spec, destination] of routes) {
      using host = await TestReact.render(<Harness.UI spec={spec} />);
      const link = await Time.waitFor(async () => {
        await React.act(() => Time.wait(0));
        return host.container.querySelector<HTMLAnchorElement>(`a[href="${destination.href}"]`);
      });
      expect(['', '_self']).to.include(link?.target);
      const reference = host.container.querySelector<HTMLAnchorElement>(
        'a[href="https://www.w3.org/TR/webauthn-3/"]',
      );
      expect(reference?.target).to.eql('_blank');
      expect(reference?.rel.split(' ')).to.include.members(['noopener', 'noreferrer']);
      expect(reference?.title).to.include('opens in a new tab');
    }
  });

  it('integration reset → pure preferences and callback history survive', () => {
    using cleanup = new DisposableStack();
    for (const key of [STORAGE_KEY.DEV, VIEW_STORAGE.DEV]) {
      const store = LocalStorage.immutable<Preferences>(key, initial);
      const previous = store.current;
      cleanup.defer(() => store.reset(previous));
      store.reset(initial);
    }
    const integration = createDebugSignals();
    const view = createView();
    cleanup.defer(integration.dispose);
    cleanup.defer(view.dispose);
    view.props.theme.value = 'Light';
    view.actions.onSignIn();
    integration.props.theme.value = 'Light';
    integration.reset();
    expect(integration.props.theme.value).to.eql('Dark');
    expect(view.props.callbackHistory.value).to.eql({ items: [{ kind: 'sign-in' }], total: 1 });
    expect(view.props.theme.value).to.eql('Light');
    const stored = LocalStorage.immutable<Preferences>(VIEW_STORAGE.DEV, initial);
    expect(stored.current).to.eql({ theme: 'Light', debug: false });
  });
});
