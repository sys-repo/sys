import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Color, css, Is, Style, type t } from '../common.ts';
import { Button } from '../mod.ts';
import { FocusExamples } from '../-spec/-ui.FocusExamples.tsx';
import { RunLabel } from '../-spec/-ui.RunLabel.tsx';
import { button, key } from './u.fixture.ts';

/** Inspect emitted declarations, not mock focus-visible matching or painted appearance. */
function ruleText(el: HTMLElement, pseudo = '') {
  const selector = `.${el.className}${pseudo}`;
  const rule = Style.Dom.stylesheet().rules.items.find((item) => item.selector === selector);
  if (Is.nil(rule)) throw new Error(`Missing CSS rule: ${selector}`);
  return rule.rule;
}

describe('Button: focus styling', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme}: emits an accent outline with a pixel offset`, async () => {
      const res = await TestReact.render(<Button theme={theme}>Run</Button>);
      try {
        const root = button(res.container);
        const rule = ruleText(root, ':focus-visible');
        expect(rule).to.include('outline-offset: 2px;');
        expect(rule).to.include(`outline: 2px solid ${Color.BLUE};`);
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
        expect(rule).not.to.include(Color.BLUE);
        const base = ruleText(root);
        expect(base).to.include('min-width: 120px;');
        expect(base).to.include('border-radius: 6px;');
        expect(base).to.include('box-shadow: 0 1px 3px black;');
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
      expect(roots.length).to.eql(4);
      const root = roots[3];
      expect(ruleText(root)).to.include('--run-focus: 0;');
      const focus = ruleText(root, ':focus-visible');
      expect(focus).to.include('--run-focus: 1;');
      expect(focus).to.include('outline: none;');
      expect(focus).not.to.include('outline-offset');
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
      expect(rule).not.to.include(Color.BLUE);
    } finally {
      React.act(() => res.dispose());
    }
  });
});
