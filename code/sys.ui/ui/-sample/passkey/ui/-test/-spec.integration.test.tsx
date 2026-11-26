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
} from './common.ts';
import { Controller } from '../../ui.controller/mod.ts';
import { SpecNames } from '../-spec/-u.navigation.ts';
import { createDebugSignals, Debug } from '../-spec.integration/-SPEC.Debug.tsx';
import { STORAGE_KEY } from '../-spec.integration/common.ts';
import { createDebugSignals as createView, Debug as ViewDebug } from '../-spec/-SPEC.Debug.tsx';
import { activate, button, buttons } from './u.fixture.tsx';

const initial = { theme: 'Dark', debug: false } as const;
type Preferences = Pick<t.Passkey.Props, 'theme' | 'debug'>;

describe('Passkey specimen sidebars', () => {
  DomMock.init({ beforeAll, afterAll });

  it('reciprocal links navigate in place; integration reset does not reset the pure view', async () => {
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
    const routes = [
      [sample.container, SpecNames.view, 'view:pure'],
      [pure.container, SpecNames.sample, 'view:integration (sample)'],
    ] as const;
    for (const [container, name, label] of routes) {
      const links = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="?dev="]')];
      expect(links.map((el) => [el.textContent, el.target, el.getAttribute('href')])).to.eql([
        [label, '_self', `?${new URLSearchParams({ dev: name })}`],
      ]);
    }
    await activate(button(pure.container, 'theme: Dark'));
    await activate(button(sample.container, 'theme: Dark'));
    await activate(button(sample.container, 'debug: false'));
    expect(integration.props.theme.value).to.eql('Light');
    const controls = buttons(sample.container).map((el) => el.textContent);
    expect(controls.slice(-2)).to.eql(['debug: true', '(reset)']);
    await activate(button(sample.container, '(reset)'));
    expect(integration.props.theme.value).to.eql('Dark');
    expect(integration.props.debug.value).to.eql(false);
    expect(view.props.intent.value).to.eql({ action: 'sign-in', count: 1 });
    expect(view.props.theme.value).to.eql('Light');
    const stored = LocalStorage.immutable<Preferences>(VIEW_STORAGE.DEV, initial);
    expect(stored.current).to.eql({ theme: 'Light', debug: false });
  });
});
