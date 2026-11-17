import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../-test.ts';
import { Color, css, pkg, Style, type t, useStylesheetRule } from '../ui.react/ui/common.ts';
import { ActionProbe } from '../ui.react/ui/ActionProbe/mod.ts';
import { ProseManuscript } from '../ui.react/ui/Prose.Manuscript/mod.ts';
import { useScopedStyles as useProbe } from '../ui.react/ui/ActionProbe/use.Styles.ts';
import { useScopedStyles as useManuscript } from '../ui.react/ui/Prose.Manuscript/use.Styles.ts';
import { code, headings } from '../ui.react/ui/Prose.Manuscript/u.styles/mod.ts';

const cases = [
  { name: 'ActionProbe', useStyles: useProbe, lineHeight: 1.9 },
  { name: 'Prose.Manuscript', useStyles: useManuscript, lineHeight: 1 },
] as const;

describe('Consumer scoped styles: ownership and registration', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const { name, useStyles, lineHeight } of cases) {
    it(`${name}: first commit registers before child layout; blocks survive real remounts`, async () => {
      const component = `@fixture/initial:${name}`;
      let observed = 0;
      function Observer() {
        React.useLayoutEffect(() => {
          expect(rules(component, 'code')).to.have.length(1);
          expect(rules(component, 'code')[0].rule).to.include(`line-height: ${lineHeight};`);
          if (name === 'Prose.Manuscript') expect(rules(component, 'h1')).to.have.length(1);
          observed++;
        }, []);
        return <code>timing</code>;
      }
      function Root() {
        const scoped = useStyles({ component, theme: Color.theme('Light') });
        return (
          <div data-component={component} className={css(scoped).class}>
            <Observer />
          </div>
        );
      }
      for (let i = 0; i < 2; i++) {
        using rendered = await TestReact.render(<Root />, { strict: false });
        expectPalette(rendered.container.querySelector('[data-component]')!, component, 'Light');
      }
      expect(observed).to.eql(2);
      expect(rules(component, 'code')).to.have.length(1);
    });

    it(`${name}: actual root keeps identity, own palette and caller-last styling through updates`, async () => {
      const component = `${pkg.name}:${name}`;
      let update!: (theme: t.CommonTheme) => void;
      function Root() {
        const [theme, setTheme] = React.useState<t.CommonTheme>('Light');
        update = setTheme;
        const style = { color: 'tomato', padding: 17 };
        return name === 'ActionProbe'
          ? (
            <ActionProbe.Probe
              theme={theme}
              style={style}
              env={{}}
              spec={{ title: 'Code', render: (e) => e.element(<code>sample</code>) }}
            />
          )
          : <ProseManuscript.UI theme={theme} style={style} />;
      }
      using rendered = await TestReact.render(<Root />);
      const root = rendered.container.querySelector(`[data-component="${component}"]`)!;
      expect(root).not.to.eql(null);
      for (const theme of ['Light', 'Dark', 'Light'] as const) {
        await React.act(() => update(theme));
        expect(rendered.container.querySelector(`[data-component="${component}"]`)).to.equal(root);
        expectPalette(root, component, theme);
        expect(properties(root)).to.include({ color: 'tomato', 'padding-top': '17px' });
      }
      expect(root.querySelector('code')?.textContent).to.eql(
        name === 'ActionProbe' ? 'sample' : 'foo.bar',
      );
    });

    it(`${name}: nested same-owner roots redeclare every binding independently`, async () => {
      const component = `@fixture/nested:${name}`;
      function Root(props: { theme: t.CommonTheme; children?: React.ReactNode }) {
        const scoped = useStyles({ component, theme: Color.theme(props.theme) });
        return <div data-component={component} className={css(scoped).class}>{props.children}</div>;
      }
      using rendered = await TestReact.render(
        <Root theme='Light'>
          <code>outer</code>
          <Root theme='Dark'>
            <code>inner</code>
          </Root>
        </Root>,
      );
      const roots = rendered.container.querySelectorAll('[data-component]');
      const outer = expectPalette(roots[0], component, 'Light');
      const inner = expectPalette(roots[1], component, 'Dark');
      expect(outer).to.eql(inner);
    });
  }

  it('Manuscript declaration blocks compose and can each be omitted without orphan bindings', async () => {
    // Pure builders do not register anything. No hook is hidden inside these callbacks.
    const theme = Color.theme('Light');
    const component = '@fixture/pure:Manuscript';
    const c = code({ component, theme });
    const h = headings({ component });
    expect(rules(component, 'code')).to.eql([]);
    expect(rules(component, 'h1')).to.eql([]);
    expect(Object.keys(c.bindings)).to.have.length(3);
    expect(h.rule).to.eql({
      fontFamily: '"ET Book", Georgia, serif',
      fontWeight: 400,
      fontSize: '3em',
      lineHeight: 1.1,
    });
    function OnlyCode() {
      const c = code({ component: '@fixture/only:code', theme });
      useStylesheetRule(c.selector, c.rule);
      return <div data-component='@fixture/only:code' className={css(c.bindings).class} />;
    }
    function OnlyHeadings() {
      const h = headings({ component: '@fixture/only:headings' });
      useStylesheetRule(h.selector, h.rule);
      return <div data-component='@fixture/only:headings' />;
    }
    using rendered = await TestReact.render(
      <>
        <OnlyCode />
        <OnlyHeadings />
      </>,
    );
    expectPalette(
      rendered.container.querySelector('[data-component="@fixture/only:code"]')!,
      '@fixture/only:code',
      'Light',
    );
    expect(rules('@fixture/only:code', 'h1')).to.eql([]);
    expect(rules('@fixture/only:headings', 'code')).to.eql([]);
    expect(rules('@fixture/only:headings', 'h1')).to.have.length(1);
    expect(
      Object.keys(
        properties(rendered.container.querySelector('[data-component="@fixture/only:headings"]')!),
      ),
    ).to.eql([]);
  });
});

function rules(component: string, selector: string) {
  return Style.Dom.stylesheet().rules.items.filter((item) =>
    item.selector === `[data-component="${component}"] ${selector}`
  );
}

function properties(root: Element) {
  const sheet = Style.Dom.stylesheet();
  const element = document.head.querySelector<HTMLStyleElement>(
    `style[data-controller="${sheet.id}"]`,
  )!;
  expect(element.isConnected).to.eql(true);
  const result: Record<string, string> = {};
  for (const rule of Array.from(element.sheet!.cssRules) as CSSStyleRule[]) {
    if (!rule.selectorText || !root.matches(rule.selectorText)) continue;
    for (const name of Array.from(rule.style)) result[name] = rule.style.getPropertyValue(name);
  }
  return result;
}

function expectPalette(root: Element, component: string, theme: t.CommonTheme) {
  const emitted = rules(component, 'code');
  expect(emitted).to.have.length(1);
  const rule = emitted[0].rule;
  const refs = Array.from(rule.matchAll(/var\((--[^)]+)\)/g), (m) => m[1]);
  expect(refs).to.have.length(3);
  expect(new Set(refs).size).to.eql(3);
  const values = properties(root);
  const declarations = [
    ['fg', 0.8, 'color:'],
    ['bg', 0.03, 'background-color:'],
    ['border', 0.15, 'border: solid 1px'],
  ] as const;
  for (const [suffix, alpha, declaration] of declarations) {
    const ref = refs.find((name) => name.endsWith(`-${suffix}`))!;
    expect(ref).to.match(/^--scoped-\d+-(fg|bg|border)$/);
    expect(values[ref]).to.eql(Color.alpha(Color.theme(theme).fg, alpha));
    // Include the boundary so `color` cannot match inside `background-color`.
    expect(rule).to.include(` ${declaration} var(${ref});`);
  }
  return refs;
}
