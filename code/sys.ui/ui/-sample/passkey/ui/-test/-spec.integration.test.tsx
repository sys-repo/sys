import React from 'react';
import {
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  LocalStorage,
  STORAGE_KEY as VIEW_STORAGE_KEY,
  type t,
  TestReact,
} from './common.ts';
import { Harness } from '../../-test.ui.ts';
import { SpecLinks, SpecNames } from '../../-u.navigation.ts';
import { WebAuthnLink } from '../../-ui.Links.tsx';
import { Specs, specsFor } from '../../../../src/-test/-specs.ts';
import { createDebugSignals, Debug } from '../-spec.integration/-SPEC.Debug.tsx';
import { STORAGE_KEY } from '../-spec.integration/common.ts';
import {
  createDebugSignals as createViewDebug,
  Debug as ViewDebug,
} from '../-spec/-SPEC.Debug.tsx';
import { button, buttons, element, press } from './u.fixture.tsx';

type Preferences = Pick<t.Passkey.Props, 'theme' | 'debug'>;

describe('passkey integration scaffold', () => {
  DomMock.init({ beforeAll, afterAll });

  it('listed sample and secondary view → their independent standard specs run headlessly', async () => {
    const integration = await import('../-spec.integration/-SPEC.tsx');
    const view = await import('../-spec/-SPEC.tsx');
    const href = new URL(SpecLinks.view.href, 'https://example.test/ui/').href;
    const imports = specsFor(href);
    expect((await Specs[SpecNames.sample]()).default).to.equal(integration.default);
    expect((await imports[SpecNames.view]()).default).to.equal(view.default);
    const result = await Harness.headless({
      [SpecNames.sample]: Specs[SpecNames.sample],
      [SpecNames.view]: imports[SpecNames.view],
    });
    expect(result.ok).to.eql(true);
    expect(result.total).to.eql(2);
  });

  it('pure-view debug panel → reverse navigation to the sample', async () => {
    const debug = createViewDebug();
    const res = await TestReact.render(<ViewDebug debug={debug} />);
    try {
      const link = element(res.container, 'a');
      const url = new URL(link.getAttribute('href')!, 'https://example.test/ui/');
      expect(url.searchParams.get('dev')).to.eql(SpecNames.sample);
      expect(link.getAttribute('target')).to.eql(null);
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });

  it('preferences and reset → independent from fixture state; disposal stops persistence', () => {
    const initial: Preferences = { theme: 'Dark', debug: false };
    const store = LocalStorage.immutable<Preferences>(STORAGE_KEY.DEV, initial);
    const viewStore = LocalStorage.immutable<Preferences>(VIEW_STORAGE_KEY.DEV, initial);
    const previous = store.current;
    const previousView = viewStore.current;
    store.reset(initial);
    viewStore.reset({ theme: 'Light', debug: true });
    const debug = createDebugSignals();
    const view = createViewDebug();
    try {
      view.actions.onSignIn();
      const fixture = view.props.fixture.value;
      const intent = view.props.intent.value;
      debug.props.theme.value = 'Light';
      debug.props.debug.value = true;
      debug.reset();
      expect(store.current).to.eql(initial);
      expect(viewStore.current).to.eql({ theme: 'Light', debug: true });
      expect(view.props.fixture.value).to.equal(fixture);
      expect(view.props.intent.value).to.equal(intent);

      debug.props.theme.value = 'Light';
      debug.props.debug.value = true;
      view.reset();
      expect(store.current).to.eql({ theme: 'Light', debug: true });
      expect(Object.keys(debug.props)).to.eql(['debug', 'theme']);
      debug.dispose();
      debug.props.theme.value = 'Dark';
      expect(store.current).to.eql({ theme: 'Light', debug: true });
      const reopened = createDebugSignals();
      try {
        expect(reopened.props.theme.value).to.eql('Light');
        expect(reopened.props.debug.value).to.eql(true);
      } finally {
        reopened.dispose();
      }
    } finally {
      debug.dispose();
      view.dispose();
      store.reset(previous);
      viewStore.reset(previousView);
    }
  });

  it('host reference → W3C WebAuthn Recommendation in a secure new tab', async () => {
    for (const theme of ['Light', 'Dark'] as const) {
      const res = await TestReact.render(<WebAuthnLink theme={theme} />);
      try {
        const link = element(res.container, 'a');
        expect(link.getAttribute('href')).to.eql('https://www.w3.org/TR/webauthn-3/');
        expect(link.getAttribute('target')).to.eql('_blank');
        const rel = link.getAttribute('rel')?.split(' ');
        expect(rel).to.contain('noopener');
        expect(rel).to.contain('noreferrer');
        expect(link.getAttribute('title')).to.contain('opens in a new tab');
      } finally {
        React.act(() => res.dispose());
      }
    }
  });

  it('debug panel → view link and standard appearance/reset controls', async () => {
    const debug = createDebugSignals();
    debug.props.theme.value = 'Dark';
    debug.props.debug.value = false;
    const res = await TestReact.render(<Debug debug={debug} />);
    try {
      const link = element(res.container, 'a');
      expect(link.textContent).to.contain('view:pure');
      expect(link.getAttribute('href')).to.eql(SpecLinks.view.href);
      expect(link.getAttribute('target')).to.eql(null);
      expect(res.container.querySelectorAll('a').length).to.eql(1);
      expect(res.container.textContent).not.to.contain('Property States');
      await React.act(async () => press(button(res.container, 'theme: Dark'), 'Enter'));
      expect(debug.props.theme.value).to.eql('Light');
      await React.act(async () => press(button(res.container, 'debug: false'), 'Enter'));
      expect(debug.props.debug.value).to.eql(true);
      const controls = buttons(res.container);
      expect(controls.indexOf(button(res.container, 'debug: true'))).to.eql(
        controls.indexOf(button(res.container, '(reset)')) - 1,
      );
      await React.act(async () => press(button(res.container, '(reset)'), 'Enter'));
      expect(debug.props.theme.value).to.eql('Dark');
      expect(debug.props.debug.value).to.eql(false);
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });
});
