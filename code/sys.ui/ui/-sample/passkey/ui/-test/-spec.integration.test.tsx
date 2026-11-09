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
import { Color, Schedule } from '../../common.ts';
import { Style } from '@sys/ui-css';
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
      const link = assertSpecLink(res.container, 'sample');
      const url = new URL(link.getAttribute('href')!, 'https://example.test/ui/');
      expect(url.searchParams.get('dev')).to.eql(SpecNames.sample);
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

  it('host reference → WebAuthn destination, _blank safeguards, and host styling', async () => {
    for (const theme of ['Light', 'Dark'] as const) {
      const res = await TestReact.render(<WebAuthnLink theme={theme} />);
      try {
        const link = element(res.container, 'a');
        expect(link.getAttribute('href')).to.eql('https://www.w3.org/TR/webauthn-3/');
        expect(link.getAttribute('target')).to.eql('_blank');
        const rel = link.getAttribute('rel')?.split(' ');
        expect(rel).to.contain('noopener');
        expect(rel).to.contain('noreferrer');
        const title = link.getAttribute('title');
        expect(title).to.eql('Web Authentication Level 3 — W3C specification (opens in a new tab)');
        expect(link.textContent).to.eql('WebAuthn · W3C');
        expect(link.querySelectorAll('[aria-hidden="true"] svg').length).to.eql(2);
        expect(link.querySelectorAll('svg').length).to.eql(2);
        expect(link.querySelector('div')).to.eql(null);
        expect(res.container.querySelectorAll('a').length).to.eql(1);
        expect(link.tabIndex).to.eql(0);
        expect(link.querySelector('a, button, [tabindex]')).to.eql(null);
        const hintId = link.getAttribute('aria-describedby')!;
        const hint = link.ownerDocument.getElementById(hintId)!;
        expect(hint.textContent).to.eql('Opens in a new tab');
        expect(hint.hidden).to.eql(true);
        expect(link.nextElementSibling).to.equal(hint);
        expect(res.container.querySelectorAll('[hidden]').length).to.eql(1);
        const rule = Style.Dom.stylesheet().rules.items.find((item) => {
          return item.selector === `.${link.className}`;
        });
        expect(rule?.style).to.include({ color: Color.theme(theme).fg, fontSize: 12 });
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
      const link = assertSpecLink(res.container, 'view');
      const url = new URL(link.getAttribute('href')!, 'https://example.test/ui/');
      expect(url.searchParams.get('dev')).to.eql(SpecNames.view);
      expect(res.container.textContent).not.to.contain('Property States');
      await React.act(async () => {
        press(button(res.container, 'theme: Dark'), 'Enter');
        await Schedule.micro();
      });
      expect(debug.props.theme.value).to.eql('Light');
      expect(assertSpecLink(res.container, 'view')).to.equal(link);
      await React.act(async () => {
        press(button(res.container, 'debug: false'), 'Enter');
        await Schedule.micro();
      });
      expect(debug.props.debug.value).to.eql(true);
      const controls = buttons(res.container);
      const debugIndex = controls.indexOf(button(res.container, 'debug: true'));
      const resetIndex = controls.indexOf(button(res.container, '(reset)'));
      expect(debugIndex).to.eql(resetIndex - 1);
      await React.act(async () => {
        press(button(res.container, '(reset)'), 'Enter');
        await Schedule.micro();
      });
      expect(debug.props.theme.value).to.eql('Dark');
      expect(debug.props.debug.value).to.eql(false);
    } finally {
      React.act(() => res.dispose());
      debug.dispose();
    }
  });
});

/** Consumer DOM/CSS contracts only; browser navigation and focus geometry need visual verification. */
function assertSpecLink(container: HTMLElement, to: keyof typeof SpecLinks) {
  const link = element(container, 'a');
  expect(link.getAttribute('href')).to.eql(SpecLinks[to].href);
  expect(link.textContent).to.eql(SpecLinks[to].label);
  expect(link.getAttribute('target')).to.eql('_self');
  expect(container.querySelectorAll('a').length).to.eql(1);
  expect(link.querySelectorAll('[aria-hidden="true"] svg').length).to.eql(1);
  expect(link.querySelectorAll('svg').length).to.eql(1);
  expect(link.hasAttribute('aria-describedby')).to.eql(false);
  expect(link.hasAttribute('title')).to.eql(false);
  expect(link.hasAttribute('download')).to.eql(false);
  expect(link.tabIndex).to.eql(0);
  expect(link.querySelector('a, button, [tabindex]')).to.eql(null);
  const rules = Style.Dom.stylesheet().rules.items;
  const rule = rules.find((item) => item.selector === `.${link.className}`);
  expect(rule?.style).to.include({
    textDecoration: `underline dashed ${Color.alpha(Color.theme('Light').fg, 0.25)}`,
  });
  const focus = rules.find((item) => item.selector === `.${link.className}:focus-visible`);
  expect(focus?.rule).to.include('outline:');
  return link;
}
