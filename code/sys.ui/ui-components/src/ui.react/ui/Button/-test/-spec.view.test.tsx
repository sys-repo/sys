import React from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  hostFixture,
  it,
  storageFixture,
  TestReact,
} from '../../../-test.ts';
import { D, Is, Json, Schedule, Signal, type t } from '../common.ts';
import { Root } from '../-spec/-ui.Root.tsx';
import { button, key } from './u.fixture.ts';

type DebugModule = typeof import('../-spec/-SPEC.Debug.tsx');
type Stored = {
  theme?: t.CommonTheme;
  debug?: boolean;
  enabled?: boolean;
  active?: boolean;
  opacity?: number;
  view?: 'single' | 'variants';
};
const storageKey = `dev:${D.displayName}`;

// The legacy snapshot deliberately has no view field.
const legacy: Stored = { theme: 'Dark', debug: true, enabled: true, active: true, opacity: 1 };

describe('Button spec: view', () => {
  let debugModule: DebugModule;
  let storage: ReturnType<typeof storageFixture>;
  let host: Awaited<ReturnType<typeof hostFixture>>;
  beforeAll(async () => {
    storage = storageFixture();
    // Debug's module-level styles must bind to the test document, not a server-side dummy sheet.
    debugModule = await import('../-spec/-SPEC.Debug.tsx');
  });
  beforeEach(async () => {
    storage.seed(storageKey, legacy);
    host = await hostFixture();
  });
  afterEach(() => host[Symbol.dispose]());
  afterAll(async () => {
    storage[Symbol.dispose]();
    await DomMock.unpolyfill();
  });

  it('defaults legacy storage to the single, unwrapped primitive', async () => {
    const debug = debugModule.createDebugSignals();
    expect(debug.props.view.value).to.eql('single');
    const res = await TestReact.render(<Root {...Signal.toObject(debug.props)} />);
    try {
      const root = button(res.container);
      expect(res.container.childElementCount).to.eql(1);
      expect(res.container.firstElementChild).to.equal(root);
      expect(res.container.querySelectorAll('[role="button"]').length).to.eql(1);
      expect(res.container.querySelector('section')).to.eql(null);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('cycles single → variants → single from the debug control and persists the choice', async () => {
    const debug = debugModule.createDebugSignals();
    debug.attach(host.ctx, {});
    const { Debug } = debugModule;
    const stored = () => Json.parse<Stored>(localStorage.getItem(storageKey) ?? undefined);
    function Subject() {
      Signal.useRedrawEffect(debug.listen);
      return <Root {...Signal.toObject(debug.props)} />;
    }
    const res = await TestReact.render(
      <>
        <div>
          <Subject />
        </div>
        <Debug debug={debug} />
      </>,
    );
    try {
      const subject = res.container.firstElementChild!;
      const control = [...res.container.querySelectorAll<HTMLElement>('[role="button"]')]
        .find((el) => el.textContent === 'view: single');
      if (Is.nil(control)) throw new Error('Expected the view control.');
      React.act(() => control.focus());
      key(control, 'keydown', 'Enter');
      key(control, 'keyup', 'Enter');
      await React.act(async () => {
        await Schedule.micro();
      });
      expect(debug.props.view.value).to.eql('variants');
      expect(subject.querySelectorAll('[role="button"]').length).to.be.greaterThan(1);
      expect(stored()?.view).to.eql('variants');
      expect(debugModule.createDebugSignals().props.view.value).to.eql('variants');

      key(control, 'keydown', ' ');
      expect(debug.props.view.value).to.eql('variants');
      key(control, 'keyup', ' ');
      await React.act(async () => {
        await Schedule.micro();
      });
      expect(debug.props.view.value).to.eql('single');
      expect(subject.querySelectorAll('[role="button"]').length).to.eql(1);
      expect(subject.firstElementChild).to.equal(button(subject as HTMLElement));
      expect(stored()?.view).to.eql('single');
    } finally {
      React.act(() => res.dispose());
    }
  });

  for (const view of ['single', 'variants'] as const) {
    it(`${view}: debug controls expose automatic disabled opacity and explicit overrides`, async () => {
      const debug = debugModule.createDebugSignals();
      debug.attach(host.ctx, {});
      const { Debug } = debugModule;
      function Subject() {
        Signal.useRedrawEffect(debug.listen);
        return <Root {...Signal.toObject(debug.props)} />;
      }
      const res = await TestReact.render(
        <>
          <div>
            <Subject />
          </div>
          <Debug debug={debug} />
        </>,
      );
      try {
        const subject = res.container.firstElementChild!;
        const panel = res.container.lastElementChild!;
        const clickControl = async (label: string) => {
          const control = [...panel.querySelectorAll<HTMLElement>('[role="button"]')]
            .find((el) => el.textContent === label);
          if (Is.nil(control)) throw new Error(`Missing debug control: ${label}`);
          await React.act(async () => {
            control.click();
            await Schedule.micro();
          });
        };
        const roots = () => [...subject.querySelectorAll<HTMLElement>('[role="button"]')];
        const window = res.container.ownerDocument.defaultView!;
        const opacities = () => roots().map((el) => window.getComputedStyle(el).opacity);

        // Preserve a saved numeric override; reset restores production opacity behavior.
        expect(debug.props.opacity.value).to.eql(1);
        await clickControl('(reset)');
        expect(debug.props.opacity.value).to.eql(undefined);
        expect(panel.textContent).to.include('opacity: auto');
        if (view === 'variants') await clickControl('view: single');
        const buttonCount = roots().length;
        expect(buttonCount).to.be.greaterThan(0);
        const expected = (opacity: string) => Array(buttonCount).fill(opacity);
        expect(opacities()).to.eql(expected('1'));

        await clickControl('enabled: true');
        expect(opacities()).to.eql(expected('0.3'));
        expect(roots().every((el) => el.tabIndex === -1)).to.eql(true);
        expect(roots().every((el) => el.getAttribute('aria-disabled') === 'true')).to.eql(true);

        await clickControl('opacity: auto');
        expect(opacities()).to.eql(expected('1'));
        await clickControl('opacity: 1 (override)');
        expect(opacities()).to.eql(expected('0.1'));
        await clickControl('opacity: 0.1 (override)');
        await clickControl('opacity: ƒ');
        expect(opacities()).to.eql(expected('0.3'));
        expect(debugModule.createDebugSignals().props.opacity.value).to.eql(undefined);

        // Inactive is an interaction gate, not another disabled-opacity policy.
        await clickControl('enabled: false');
        await clickControl('enabled: ƒ');
        await clickControl('active: true');
        expect(opacities()).to.eql(expected('1'));
        expect(roots().every((el) => el.tabIndex === -1)).to.eql(true);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }
});
