import React from 'react';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';
import { Color, D, Is, Json, LocalStorage, Schedule, Signal, type t } from '../common.ts';
import { Root } from '../-spec/-ui.Root.tsx';
import { button, key } from './u.fixture.ts';
import { ruleText } from './u.fixture.focus.ts';

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
  DomMock.init({ beforeAll, afterAll });
  let debugModule: DebugModule;
  beforeAll(async () => {
    // Debug's module-level styles must bind to the test document, not a server-side dummy sheet.
    debugModule = await import('../-spec/-SPEC.Debug.tsx');
  });
  beforeEach(() => LocalStorage.immutable<Stored>(storageKey, legacy).reset(legacy));

  it('defaults legacy storage to the single, unwrapped primitive', async () => {
    const debug = debugModule.createDebugSignals();
    expect(debug.props.view.value).to.eql('single');
    const res = await TestReact.render(<Root {...Signal.toObject(debug.props)} />);
    try {
      const root = button(res.container);
      expect(res.container.childElementCount).to.eql(1);
      expect(res.container.firstElementChild).to.equal(root);
      expect(res.container.querySelectorAll('[role="button"]').length).to.eql(1);
      expect(root.textContent).to.eql('👋 Hello Button');
      expect(res.container.querySelector('section')).to.eql(null);
      const rule = ruleText(root);
      expect(rule).to.include('display: inline-block;');
      expect(rule).not.to.include('padding');
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('cycles single → variants → single from the debug control and persists the choice', async () => {
    const debug = debugModule.createDebugSignals();
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
      expect(control.parentElement!.childElementCount).to.eql(1);
      React.act(() => control.focus());
      key(control, 'keydown', 'Enter');
      key(control, 'keyup', 'Enter');
      await React.act(async () => {
        await Schedule.micro();
      });
      expect(debug.props.view.value).to.eql('variants');
      expect(subject.querySelectorAll('[role="button"]').length).to.eql(5);
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
        const expected = (opacity: string) => Array(view === 'single' ? 1 : 5).fill(opacity);

        // Preserve a saved numeric override; reset restores production opacity behavior.
        expect(debug.props.opacity.value).to.eql(1);
        await clickControl('(reset)');
        expect(debug.props.opacity.value).to.eql(undefined);
        expect(panel.textContent).to.include('opacity: auto');
        if (view === 'variants') await clickControl('view: single');
        expect(opacities()).to.eql(expected('1'));

        await clickControl('enabled: true');
        expect(opacities()).to.eql(expected('0.3'));
        expect(roots().every((el) => el.tabIndex === -1)).to.eql(true);

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

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme}: renders compact variant labels, dividers, and a trailing icon`, async () => {
      const res = await TestReact.render(<Root view='variants' theme={theme} />);
      try {
        const frame = res.container.firstElementChild!;
        expect([...frame.children].map((el) => el.tagName)).to.eql([
          'SECTION',
          'DIV',
          'SECTION',
          'DIV',
          'SECTION',
          'DIV',
          'SECTION',
          'DIV',
          'SECTION',
        ]);
        const sections = [...frame.querySelectorAll<HTMLElement>('section')];
        const titles = sections.map((el) => el.firstElementChild!);
        const labels = titles.map((el) => el.textContent);
        expect(labels).to.eql([
          'default · bare text',
          'default · rounded / icon',
          'custom root · complete focus block',
          'child-owned · css inheritance through a wrapper',
          'shared arrival · child-owned through a wrapper',
        ]);
        expect(ruleText(frame)).not.to.include('gap:');
        for (const title of titles) {
          expect(ruleText(title)).to.include('margin-top: 2px;');
        }

        const open = button(sections[1]);
        const arrow = open.querySelector('svg');
        if (Is.nil(arrow)) throw new Error('Expected an SVG arrow after Open.');
        expect(open.textContent).to.eql('Open');
        expect(arrow.getAttribute('width')).to.eql('14');
        expect(arrow.getAttribute('height')).to.eql('14');
        expect(arrow.closest('[aria-hidden="true"]')?.previousSibling?.textContent).to.eql('Open');

        const dividers = [...frame.children].filter((el) => el.tagName === 'DIV');
        expect(dividers.length).to.eql(4);
        for (const divider of dividers) {
          expect(divider.getAttribute('aria-hidden')).to.eql('true');
          expect(divider.getAttribute('tabindex')).to.eql(null);
          const rule = ruleText(divider);
          expect(rule).to.include(`background-color: ${Color.alpha(Color.theme(theme).fg, 0.1)};`);
          expect(rule).to.include('height: 1px;');
          expect(rule).to.include('margin-left: -10px;');
          expect(rule).to.include('margin-right: -10px;');
          expect(rule).to.include('margin-top: 14px;');
          expect(rule).to.include('margin-bottom: 0px;');
          expect(rule).to.include('pointer-events: none;');
        }
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('variants have no outer padding and retain the shared availability controls', async () => {
    const res = await TestReact.render(<Root view='variants' enabled={false} active={false} />);
    try {
      const frame = res.container.firstElementChild!;
      const rule = ruleText(frame);
      expect(rule).to.include('display: grid;');
      expect(rule).not.to.include('padding');
      const roots = res.container.querySelectorAll<HTMLElement>('[role="button"]');
      expect(roots.length).to.eql(5);
      for (const root of roots) {
        expect(root.tabIndex).to.eql(-1);
        expect(root.getAttribute('aria-disabled')).to.eql('true');
      }
    } finally {
      React.act(() => res.dispose());
    }
  });
});
