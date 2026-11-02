import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Color, css, Style, type t } from '../common.ts';
import { Button } from '../mod.ts';
import { FocusExamples } from '../-spec/-ui.FocusExamples.tsx';
import { RunLabel, runLabelFocus } from '../-spec/-ui.RunLabel.tsx';
import { button, key } from './u.fixture.ts';
import { mediaRules, ruleText } from './u.fixture.focus.ts';

describe('Button: focus styling', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme}: emits an immediate accent with a 70ms hold and 220ms settle`, async () => {
      const res = await TestReact.render(<Button theme={theme}>Run</Button>);
      try {
        const root = button(res.container);
        const rule = ruleText(root, ':focus-visible');
        expect(rule).to.include('outline-offset: var(--sys-button-focus-offset);');
        expect(rule).to.include(
          'outline: var(--sys-button-focus-width) solid var(--sys-button-focus-rest);',
        );
        expect(rule).to.include(
          'animation: 220ms ease-out 70ms 1 normal backwards running var(--sys-focus-animation);',
        );
        const base = ruleText(root);
        expect(base).to.include('border-radius: 1px;');
        expect(base).to.include('--sys-button-focus-width: 2px;');
        expect(base).to.include('--sys-button-focus-offset: 2px;');
        expect(base).to.include(`--sys-button-focus-accent: ${Color.BLUE};`);
        expect(base).to.include(`--sys-button-focus-rest: ${Color.alpha(Color.BLUE, 0.2)};`);
        expect(base).to.include('--sys-focus-animation: sys-focus-arrival-outline;');
        expect(rule).not.to.include('opacity');
        expect(rule).not.to.include('box-shadow');
        expect(root.tagName).to.eql('DIV');
        expect(root.tabIndex).to.eql(0);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  const inputs: { name: string; wrap: (style: t.CssValue) => t.CssInput }[] = [
    { name: 'plain', wrap: (style) => style },
    { name: 'array', wrap: (style) => [false, [undefined, style]] },
    { name: 'transformed', wrap: (style) => css(style) },
  ];

  for (const { name, wrap } of inputs) {
    it(`${name}: replaces the complete focus block without changing activation or layout`, async () => {
      let clicks = 0;
      const style = wrap({
        minWidth: 120,
        borderRadius: 6,
        boxShadow: '0 1px 3px black',
        ':focus-visible': { outline: 'none' },
      });
      const res = await TestReact.render(
        <Button label={() => 'Run'} style={style} onClick={() => clicks++}>
          <span>child</span>
        </Button>,
      );
      try {
        const root = button(res.container);
        const rule = ruleText(root, ':focus-visible');
        expect(rule).to.include('outline: none;');
        expect(rule).not.to.include('outline-offset');
        expect(rule).not.to.include('animation');
        expect(rule).not.to.include(Color.BLUE);
        const base = ruleText(root);
        expect(base).to.include('min-width: 120px;');
        expect(base).to.include('border-radius: 6px;');
        expect(base).to.include('box-shadow: 0 1px 3px black;');
        expect(base).not.to.include('--sys-button-focus');
        expect(base).not.to.include('--sys-focus');
        expect(mediaRules(root)).to.eql([]);
        expect(root.textContent).to.eql('Runchild');
        React.act(() => root.focus());
        key(root, 'keydown', 'Enter');
        key(root, 'keyup', 'Enter');
        expect(clicks).to.eql(1);
        key(root, 'keydown', ' ');
        expect(clicks).to.eql(1);
        key(root, 'keyup', ' ');
        expect(clicks).to.eql(2);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  for (const { name, wrap } of inputs) {
    it(`${name}: customizes palette and geometry while retaining focus policy`, async () => {
      const style = wrap({
        borderRadius: 0,
        '--sys-button-focus-accent': '#a855f7',
        '--sys-button-focus-rest': '#887399',
        '--sys-button-focus-width': '3px',
        '--sys-button-focus-offset': '0px',
      });
      const res = await TestReact.render(<Button style={style}>Run</Button>);
      try {
        const root = button(res.container);
        const base = ruleText(root);
        expect(base).to.include('border-radius: 0px;');
        expect(base).to.include('--sys-button-focus-accent: #a855f7;');
        expect(base).to.include('--sys-button-focus-rest: #887399;');
        expect(base).to.include('--sys-button-focus-width: 3px;');
        expect(base).to.include('--sys-button-focus-offset: 0px;');
        const focus = ruleText(root, ':focus-visible');
        expect(focus).to.include(
          'outline: var(--sys-button-focus-width) solid var(--sys-button-focus-rest);',
        );
        expect(focus).to.include('outline-offset: var(--sys-button-focus-offset);');
        expect(focus).to.include('running var(--sys-focus-animation);');
        expect(base).to.include('--sys-focus-arrival-outline: var(--sys-button-focus-accent);');
        expect(base).to.include(
          '--sys-focus-forced-outline: var(--sys-button-focus-width) solid Highlight;',
        );
        expect(base).to.include('--sys-focus-forced-offset: var(--sys-button-focus-offset);');
        expect(mediaRules(root)).to.eql([
          `@media (prefers-reduced-motion: reduce) { .${root.className} { --sys-focus-animation: none; } }`,
          `@media (forced-colors: active) { .${root.className} { --sys-focus-animation: none; } }`,
          `@media (forced-colors: active) { .${root.className}:focus-visible { outline: var(--sys-focus-forced-outline); outline-offset: var(--sys-focus-forced-offset); } }`,
        ]);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  for (const replacement of [false, true]) {
    it(`templates preserve explicit layout clears with ${replacement ? 'replacement' : 'default'} focus`, async () => {
      const focus = replacement
        ? { ':focus-visible': { outline: '2px solid red', outlineOffset: '2px' } }
        : {};
      const res = await TestReact.render(
        <Button minWidth={120} style={{ Padding: 4, minWidth: undefined, ...focus }}>Run</Button>,
      );
      try {
        const root = button(res.container);
        expect(ruleText(root)).to.include('padding-top: 4px;');
        expect(ruleText(root)).not.to.include('min-width:');
        expect(ruleText(root, ':focus-visible')).to.include(
          replacement
            ? 'outline: 2px solid red;'
            : 'outline: var(--sys-button-focus-width) solid var(--sys-button-focus-rest);',
        );
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('template normalization preserves an explicit focus clear in nested input', async () => {
    const res = await TestReact.render(
      <Button
        style={[
          { ':focus-visible': { outline: '2px solid red' } },
          [false, { Padding: 4, ':focus-visible': undefined }],
        ]}
      >
        Run
      </Button>,
    );
    try {
      const root = button(res.container);
      expect(ruleText(root)).to.include('padding-top: 4px;');
      expect(ruleText(root)).not.to.include('--sys-button-focus');
      expect(ruleText(root)).not.to.include('--sys-focus');
      expect(mediaRules(root)).to.eql([]);
      const selector = `.${root.className}:focus-visible`;
      const items = Style.Dom.stylesheet().rules.items;
      expect(items.some((item) => item.selector === selector)).to.eql(false);
    } finally {
      React.act(() => res.dispose());
    }
  });

  const animations: { name: string; style: t.CssValue; declaration: string }[] = [
    {
      name: 'shorthand',
      style: { animation: 'caller-pulse 2s linear infinite' },
      declaration: 'animation: caller-pulse 2s linear infinite;',
    },
    {
      name: 'longhand',
      style: { animationName: 'caller-pulse', animationDuration: '2s' },
      declaration: 'animation-name: caller-pulse;',
    },
    {
      name: 'timing-only',
      style: { animationDuration: '2s' },
      declaration: 'animation-duration: 2s;',
    },
  ];
  for (const { name, style, declaration } of animations) {
    it(`preserves caller ${name} animation and keeps focus static`, async () => {
      const res = await TestReact.render(<Button style={style}>Run</Button>);
      try {
        const root = button(res.container);
        expect(ruleText(root)).to.include(declaration);
        const focus = ruleText(root, ':focus-visible');
        expect(focus).to.include(
          'outline: var(--sys-button-focus-width) solid var(--sys-button-focus-rest);',
        );
        expect(focus).not.to.include('animation');
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('registers one colour keyframe and omits default policy from custom focus examples', async () => {
    const res = await TestReact.render(<FocusExamples />);
    try {
      const frames = Style.Dom.stylesheet().rules.items
        .filter((item) => item.rule.startsWith('@keyframes sys-focus-arrival-outline'))
        .map((item) => item.rule);
      expect(frames).to.eql([
        '@keyframes sys-focus-arrival-outline { from { outline-color: var(--sys-focus-arrival-outline); } }',
      ]);
      const roots = res.container.querySelectorAll<HTMLElement>('[role="button"]');
      for (const root of [roots[2], roots[3], roots[4]]) {
        expect(ruleText(root)).not.to.include('--sys-button-focus');
        expect(ruleText(root)).not.to.include('--sys-focus');
        expect(ruleText(root, ':focus-visible')).not.to.include('--sys-button-focus');
        expect(mediaRules(root)).to.eql([]);
      }
      expect(ruleText(roots[2], ':focus-visible')).to.include('outline: 2px dashed currentColor;');
      expect(ruleText(roots[3], ':focus-visible')).to.include('outline: none;');
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('deduplicates rules and initializes per-Button palette and geometry', async () => {
    const render = () => {
      return TestReact.render(
        <Button
          style={{
            '--sys-button-focus-accent': 'orange',
            '--sys-button-focus-rest': 'maroon',
            '--sys-button-focus-width': '3px',
            '--sys-button-focus-offset': '-1px',
          }}
        >
          <Button>Run</Button>
        </Button>,
      );
    };
    const first = await render();
    try {
      const count = Style.Dom.stylesheet().rules.length;
      const second = await render();
      try {
        expect(Style.Dom.stylesheet().rules.length).to.eql(count);
        const roots = second.container.querySelectorAll<HTMLElement>('[role="button"]');
        expect(ruleText(roots[0])).to.include('--sys-button-focus-accent: orange;');
        expect(ruleText(roots[0])).to.include('--sys-button-focus-rest: maroon;');
        expect(ruleText(roots[0])).to.include('--sys-button-focus-width: 3px;');
        expect(ruleText(roots[0])).to.include('--sys-button-focus-offset: -1px;');
        expect(ruleText(roots[1])).to.include('--sys-button-focus-width: 2px;');
        expect(ruleText(roots[1])).to.include('--sys-button-focus-offset: 2px;');
        expect(ruleText(roots[1])).to.include(`--sys-button-focus-accent: ${Color.BLUE};`);
        expect(ruleText(roots[1])).to.include(
          `--sys-button-focus-rest: ${Color.alpha(Color.BLUE, 0.2)};`,
        );
      } finally {
        React.act(() => second.dispose());
      }
    } finally {
      React.act(() => first.dispose());
    }
  });

  for (const opacity of [undefined, 0.5]) {
    it(`independent child accepts an opacity value without Button (${opacity ?? 'default'})`, async () => {
      const res = await TestReact.render(<RunLabel indicatorOpacity={opacity} />);
      try {
        expect(res.container.querySelector('[role="button"]')).to.eql(null);
        const indicator = res.container.querySelector<HTMLElement>('[aria-hidden="true"]')!;
        const rule = ruleText(indicator);
        expect(rule).to.include(`opacity: ${opacity ?? 0};`);
        expect(rule).to.include('outline: 2px solid currentColor;');
        expect(rule).to.include('outline-offset: 2px;');
        expect(rule).to.include('pointer-events: none;');
        expect(rule).not.to.include('--run-focus');
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('spec wires native CSS to the child through a neutral wrapper without remounting it', async () => {
    let clicks = 0;
    const res = await TestReact.render(<FocusExamples onClick={() => clicks++} />);
    try {
      const roots = res.container.querySelectorAll<HTMLElement>('[role="button"]');
      expect(roots.length).to.eql(5);
      const root = roots[3];
      expect(ruleText(root)).to.include('--run-focus: 0;');
      const focus = ruleText(root, ':focus-visible');
      expect(focus).to.include('--run-focus: 1;');
      expect(focus).to.include('outline: none;');
      expect(focus).not.to.include('outline-offset');
      expect(focus).not.to.include('animation');
      const indicator = root.querySelector<HTMLElement>('[aria-hidden="true"]')!;
      expect(ruleText(indicator)).to.include('opacity: var(--run-focus, 0);');
      // Declarations/wiring only: mock focus does not prove browser selector matching/inheritance.
      React.act(() => root.focus());
      key(root, 'keydown', ' ');
      expect(clicks).to.eql(0);
      expect(root.querySelector('[aria-hidden="true"]')).to.equal(indicator);
      key(root, 'keyup', ' ');
      expect(clicks).to.eql(1);
      expect(root.querySelector('[aria-hidden="true"]')).to.equal(indicator);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('shared child arrival uses host activation, keeps its own animation and retains DOM identity', async () => {
    const res = await TestReact.render(<FocusExamples />);
    try {
      const root = res.container.querySelectorAll<HTMLElement>('[role="button"]')[4];
      expect(ruleText(root)).to.include('--run-arrival: none;');
      expect(ruleText(root)).to.include('--run-arrival-visible: 0;');
      expect(ruleText(root, ':focus-visible')).to.include(
        '--run-arrival: sys-focus-arrival-outline;',
      );
      expect(ruleText(root, ':focus-visible')).to.include('--run-arrival-visible: 1;');
      expect(mediaRules(root)).to.eql([]);
      const indicator = root.querySelector<HTMLElement>('[aria-hidden="true"]')!;
      expect(indicator.parentElement?.parentElement?.tagName).to.eql('DIV');
      expect(ruleText(indicator)).to.include('--sys-focus-animation: var(--run-arrival, none);');
      expect(ruleText(indicator)).to.include('opacity: var(--run-arrival-visible, 0);');
      expect(ruleText(indicator)).to.include('220ms ease-out 70ms 1 normal backwards');
      expect(ruleText(indicator)).to.include('outline: 2px solid currentColor;');
      expect(mediaRules(indicator).length).to.eql(3);
      React.act(() => root.focus());
      key(root, 'keydown', ' ');
      key(root, 'keyup', ' ');
      React.act(() => root.blur());
      React.act(() => root.focus());
      expect(root.querySelector('[aria-hidden="true"]')).to.equal(indicator);
      // DOM identity and generated declarations do not prove browser animation replay.
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('renders the animated child independently through a neutral host with caller-owned animation', async () => {
    const child = runLabelFocus('--independent-focus');
    const host = css({ animation: 'caller-pulse 2s linear infinite' }, child.activation);
    const res = await TestReact.render(
      <div tabIndex={0} className={host.class}>
        <div>
          <RunLabel indicatorClass={child.class} />
        </div>
      </div>,
    );
    try {
      expect(res.container.querySelector('[role="button"]')).to.eql(null);
      const root = res.container.firstElementChild as HTMLElement;
      const indicator = root.querySelector<HTMLElement>('[aria-hidden="true"]')!;
      expect(ruleText(root)).to.include('animation: caller-pulse 2s linear infinite;');
      expect(indicator.className).to.eql(child.class);
      expect(ruleText(indicator)).to.include('running var(--sys-focus-animation);');
      expect(ruleText(indicator)).to.include('opacity: var(--independent-focus-visible, 0);');
      expect(ruleText(root, ':focus-visible')).to.include(
        '--independent-focus: sys-focus-arrival-outline;',
      );
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('emits a complete custom outline and explicit offset without default leftovers', async () => {
    const res = await TestReact.render(
      <Button style={{ ':focus-visible': { outline: '3px dashed red', outlineOffset: '3px' } }}>
        Run
      </Button>,
    );
    try {
      const rule = ruleText(button(res.container), ':focus-visible');
      expect(rule).to.include('outline: 3px dashed red;');
      expect(rule).to.include('outline-offset: 3px;');
      expect(rule).not.to.include('animation');
      expect(rule).not.to.include(Color.BLUE);
    } finally {
      React.act(() => res.dispose());
    }
  });
});
