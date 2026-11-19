import React from 'react';
import type { UseStylesheetRule } from '@sys/ui-react/t';
import {
  act,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  renderHook,
  Style,
  type t,
} from '../../../-test.ts';
import { useStylesheetRule } from '../mod.ts';

type RuleInput = {
  selector: string;
  style: t.Style.Value | t.Style.Value[];
  options?: t.CssDom.RuleOptions;
};

// Observe delegation while retaining the real stylesheet, serializer, and deduplication.
const stylesheet = Style.Dom.stylesheet;

describe('useStylesheetRule', () => {
  DomMock.init({ beforeAll, afterAll });

  let sheet: t.CssDom.Stylesheet;
  let rule: t.CssDom.Stylesheet['rule'];
  let acquisitions: number;
  let calls: RuleInput[];
  let events: string[];

  beforeEach(() => {
    sheet = stylesheet();
    rule = sheet.rule;
    acquisitions = 0;
    calls = [];
    events = [];
    Style.Dom.stylesheet = (...args) => {
      acquisitions++;
      events.push('sheet');
      return stylesheet(...args);
    };
    sheet.rule = (selector, style, options) => {
      events.push('rule');
      calls.push({ selector, style, options });
      return rule(selector, style, options);
    };
  });

  afterEach(() => {
    sheet.rule = rule;
    Style.Dom.stylesheet = stylesheet;
  });

  it('exports the same hook through the root, hooks, and public type surfaces', async () => {
    const { useStylesheetRule: root } = await import('@sys/ui-react');
    const { useStylesheetRule: hooks } = await import('@sys/ui-react/use');
    expect(root).to.equal(useStylesheetRule);
    expect(hooks).to.equal(useStylesheetRule);
    expectTypeOf(useStylesheetRule).toEqualTypeOf<UseStylesheetRule>();
    expectTypeOf(useStylesheetRule).toEqualTypeOf<
      (
        selector: string,
        style: t.Style.Value | t.Style.Value[],
        options?: t.CssDom.RuleOptions,
      ) => void
    >();
  });

  it('render → insertion → layout: acquires no sheet during render and returns void', () => {
    const selector = '.use-stylesheet-rule-commit';
    const style = { color: 'red' };
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      events.push('render');
      const result = useStylesheetRule(selector, style);
      expect(result).to.eql(undefined);
      expect(acquisitions).to.eql(0); // Also catches sheet acquisition inside the hook's render.
      return children;
    };
    // A child's layout setup runs before its parent's layout setup: a layout-effect adapter fails.
    const hook = renderHook(() => {
      React.useLayoutEffect(() => {
        events.push('layout');
        expect(rules(selector)).to.eql([`${selector} { color: red; }`]);
      });
    }, { wrapper });
    try {
      expect(events).to.eql(['render', 'sheet', 'rule', 'layout']);
      expect(calls[0].style).to.equal(style);
    } finally {
      hook.unmount();
    }
    expect(rules(selector)).to.eql([`${selector} { color: red; }`]);
    expect(acquisitions).to.eql(1);
  });

  it('each committed render delegates; A → B → A retains rules without cascade restoration', () => {
    const selector = '.use-stylesheet-rule-updates';
    const a = { color: 'red' };
    const hook = renderHook(
      ({ style }: { style: t.Style.Value }) => useStylesheetRule(selector, style),
      { initialProps: { style: a } },
    );
    try {
      act(() => hook.rerender({ style: a })); // Same identity and contents still delegate.
      const equivalent = { ...a };
      act(() => hook.rerender({ style: equivalent }));
      expect(calls.length).to.eql(3);
      expect(rules(selector)).to.eql([`${selector} { color: red; }`]);

      // Inputs stay stable through each commit; mutation between commits is seen on rerender.
      equivalent.color = 'blue';
      act(() => hook.rerender({ style: equivalent }));
      act(() => hook.rerender({ style: a }));
      expect(calls.length).to.eql(5);
      expect(acquisitions).to.eql(5);
      expect(rules(selector)).to.eql([
        `${selector} { color: red; }`,
        `${selector} { color: blue; }`,
      ]);
    } finally {
      hook.unmount();
    }
    expect(rules(selector).length).to.eql(2);
  });

  it('delegates changed selectors, arrays, templates, pseudo-classes, and context', () => {
    const a = '.use-stylesheet-rule-input-a';
    const b = '.use-stylesheet-rule-input-b';
    const hook = renderHook<void, RuleInput>(
      ({ selector, style, options }) => useStylesheetRule(selector, style, options),
      { initialProps: { selector: a, style: { color: 'red' } } },
    );
    try {
      const style: t.Style.Value[] = [
        { Padding: [2, 4], ':hover': { color: 'gold' } },
        { '--rule-fg': 'blue', color: 'var(--rule-fg)' },
      ];
      const options = { context: '@media screen' };
      act(() => hook.rerender({ selector: b, style, options }));
      expect(calls[1].style).to.equal(style);
      expect(calls[1].options).to.equal(options);
      const padding =
        'padding-top: 2px; padding-right: 4px; padding-bottom: 2px; padding-left: 4px;';
      expect(rules(b, `${b}:hover`)).to.eql([
        `@media screen { ${b} { ${padding} } }`,
        `@media screen { ${b}:hover { color: gold; } }`,
        `@media screen { ${b} { --rule-fg: blue; color: var(--rule-fg); } }`,
      ]);

      options.context = '@supports (display: grid)';
      act(() => hook.rerender({ selector: b, style, options }));
      expect(rules(b, `${b}:hover`).slice(3)).to.eql([
        `@supports (display: grid) { ${b} { ${padding} } }`,
        `@supports (display: grid) { ${b}:hover { color: gold; } }`,
        `@supports (display: grid) { ${b} { --rule-fg: blue; color: var(--rule-fg); } }`,
      ]);
      expect(rules(a)).to.eql([`${a} { color: red; }`]);
    } finally {
      hook.unmount();
    }
  });

  it('real remounts under Strict Mode → redundant delegation, one retained emitted rule', () => {
    const selector = '.use-stylesheet-rule-remount';
    const element = document.head.querySelector<HTMLStyleElement>(
      `style[data-controller="${sheet.id}"]`,
    )!;
    expect(element).to.exist;
    const cssom = element.sheet!;
    expect(cssom).to.exist;
    const expectRetainedRule = () => {
      expect(element.isConnected).to.eql(true);
      expect(element.parentNode).to.equal(document.head);
      expect(element.sheet).to.equal(cssom);
      const emitted = Array.from(cssom.cssRules)
        .map((rule) => rule.cssText)
        .filter((text) => text.startsWith(`${selector} {`));
      expect(emitted).to.eql([`${selector} { font-weight: 600; }`]);
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <React.StrictMode>{children}</React.StrictMode>
    );
    for (const generation of [1, 2]) {
      const before = calls.length;
      const hook = renderHook(() => useStylesheetRule(selector, { fontWeight: 600 }), { wrapper });
      try {
        // Count actual insertion registrations, not layout/passive Strict Mode replay.
        expect(calls.length - before).to.eql(1);
        expect(rules(selector)).to.eql([`${selector} { font-weight: 600; }`]);
        expectRetainedRule();
      } finally {
        hook.unmount();
      }
      expect(calls.length).to.eql(generation);
      expect(rules(selector).length).to.eql(1);
      expectRetainedRule();
    }
  });

  it('discarded suspended renders → no sheet acquisition or registration', () => {
    const selector = '.use-stylesheet-rule-discarded';
    const pending = new Promise<void>(() => {});
    let renders = 0;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <React.Suspense fallback={<div>waiting</div>}>{children}</React.Suspense>
    );
    const hook = renderHook(() => {
      renders++;
      useStylesheetRule(selector, { color: 'red' });
      throw pending;
    }, { wrapper });
    try {
      expect(renders).to.be.greaterThan(0);
      expect(acquisitions).to.eql(0);
      expect(calls).to.eql([]);
      expect(rules(selector)).to.eql([]);
    } finally {
      hook.unmount(); // Abandon the attempted tree without resolving its promise.
    }
    expect(acquisitions).to.eql(0);
  });

  it('server rendering → markup without stylesheet acquisition or registration', async () => {
    const { renderToString } = await import('react-dom/server');
    const selector = '.use-stylesheet-rule-server';
    function Server() {
      useStylesheetRule(selector, { color: 'red' });
      return <div className='use-stylesheet-rule-server'>server</div>;
    }
    expect(renderToString(<Server />)).to.eql(
      '<div class="use-stylesheet-rule-server">server</div>',
    );
    expect(acquisitions).to.eql(0);
    expect(calls).to.eql([]);
    expect(rules(selector)).to.eql([]);
  });

  it('substrate failure → propagates the original error', () => {
    const failure = new Error('stylesheet insertion failed');
    const hook = renderHook(() =>
      useStylesheetRule('.use-stylesheet-rule-failure', { color: 'red' })
    );
    try {
      sheet.rule = () => {
        throw failure;
      };
      expect(() => act(() => hook.rerender())).to.throw(failure);
    } finally {
      hook.unmount();
    }
  });

  function rules(...selectors: string[]) {
    return sheet.rules.items
      .filter((item) => selectors.includes(item.selector))
      .map((item) => item.rule);
  }
});
