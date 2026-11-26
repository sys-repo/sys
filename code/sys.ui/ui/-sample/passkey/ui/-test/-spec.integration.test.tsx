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
import { Controller } from '../../ui.controller/mod.ts';
import { SpecLinks } from '../-spec/-u.navigation.ts';
import { createDebugSignals, Debug } from '../-spec.integration/-SPEC.Debug.tsx';
import { STORAGE_KEY } from '../-spec.integration/common.ts';
import { createDebugSignals as createView, Debug as ViewDebug } from '../-spec/-SPEC.Debug.tsx';
import { activate, button } from './u.fixture.tsx';

const initial = { theme: 'Dark', debug: false } as const;
type Preferences = Pick<t.Passkey.Props, 'theme' | 'debug'>;

describe('Passkey specimens', () => {
  DomMock.init({ beforeAll, afterAll });

  it('each specimen offers a same-tab link to the other', async () => {
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
    }
  });

  it('integration reset preserves the pure view’s preferences and intent', async () => {
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
    view.actions.onSignIn();
    const controller = Controller.open();
    cleanup.defer(controller.dispose);
    using sample = await TestReact.render(<Debug debug={integration} controller={controller} />);
    using pure = await TestReact.render(<ViewDebug debug={view} />);
    await activate(button(pure.container, 'theme: Dark'));
    await activate(button(sample.container, 'theme: Dark'));
    await activate(button(sample.container, 'debug: false'));
    expect(integration.props.theme.value).to.eql('Light');
    expect(integration.props.debug.value).to.equal(true);
    await activate(button(sample.container, '(reset)'));
    expect(integration.props.theme.value).to.eql('Dark');
    expect(integration.props.debug.value).to.eql(false);
    expect(view.props.intent.value).to.eql({ action: 'sign-in', count: 1 });
    expect(view.props.theme.value).to.eql('Light');
    const stored = LocalStorage.immutable<Preferences>(VIEW_STORAGE.DEV, initial);
    expect(stored.current).to.eql({ theme: 'Light', debug: false });
  });
});
