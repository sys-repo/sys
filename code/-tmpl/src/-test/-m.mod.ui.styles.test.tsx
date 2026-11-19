import React from 'react';
import { TestReact } from '@sys/ui-react/testing/server';
import { describe, expect, it } from '../-test.ts';
import { Color, css, D, Pkg, Style, type t } from '../../-templates/tmpl.m.mod.ui/common.ts';
import { MyComponent } from '../../-templates/tmpl.m.mod.ui/ui.tsx';
import { useScopedStyles } from '../../-templates/tmpl.m.mod.ui/use.Styles.ts';

type RootProps = {
  component: string;
  theme: t.Color.Theme;
  style?: t.Style.Input;
  children?: React.ReactNode;
};

/** Test-only composition; production props remain unchanged. */
function ScopedRoot(props: RootProps) {
  const scoped = useScopedStyles(props);
  return (
    <div data-component={props.component} className={css(scoped, props.style).class}>
      {props.children}
    </div>
  );
}

describe('UI template: scoped style ownership', () => {
  it('production root → emitted references resolve on live Light → Dark → Light updates', async () => {
    let update!: (theme: t.CommonTheme) => void;
    function Live() {
      const [theme, setTheme] = React.useState<t.CommonTheme>('Light');
      update = setTheme;
      return <MyComponent theme={theme} style={{ color: 'rgba(128, 0, 128, 0.4)', padding: 17 }} />;
    }
    using rendered = await TestReact.render(<Live />);
    const root = rendered.container.querySelector(`[data-component="${D.displayName}"]`)!;
    for (const theme of ['Light', 'Dark', 'Light'] as const) {
      await React.act(() => update(theme));
      expect(rendered.container.querySelector('[data-component]')).to.equal(root);
      expectPalette(root, D.displayName, Color.theme(theme));
      expect(rootProperties(root)).to.include({
        color: 'rgba(128, 0, 128, 0.4)',
        'padding-top': '17px',
        'padding-right': '17px',
        'padding-bottom': '17px',
        'padding-left': '17px',
      });
    }
  });

  it('supplied package identities and nested themes → independent private root values', async () => {
    const a = Pkg.toString({ name: '@alpha/ui', version: '0.0.0' }, 'XMLPanel', false);
    const b = Pkg.toString({ name: '@beta/ui', version: '0.0.0' }, 'XMLPanel', false);
    const light = Color.theme('Light');
    const dark = Color.theme('Dark');
    using rendered = await TestReact.render(
      <ScopedRoot component={a} theme={light}>
        <code>outer</code>
        <ScopedRoot component={a} theme={dark}>
          <code>nested</code>
        </ScopedRoot>
        <ScopedRoot component={b} theme={dark}>
          <code>other package</code>
        </ScopedRoot>
      </ScopedRoot>,
    );
    const roots = rendered.container.querySelectorAll('[data-component]');
    expect(roots.length).to.eql(3);
    const outer = expectPalette(roots[0], a, light);
    const nested = expectPalette(roots[1], a, dark);
    const other = expectPalette(roots[2], b, dark);
    expect(nested).to.eql(outer);
    expect(other.some((name) => outer.includes(name))).to.eql(false);
  });

  it('identity changes on a committed root → selector and private namespace follow the input', async () => {
    let update!: (component: string) => void;
    function Live() {
      const [component, setComponent] = React.useState('@fixture/ui:Before');
      update = setComponent;
      return <ScopedRoot component={component} theme={Color.theme('Light')} />;
    }
    using rendered = await TestReact.render(<Live />);
    const root = rendered.container.querySelector('[data-component]')!;
    const before = expectPalette(root, '@fixture/ui:Before', Color.theme('Light'));
    await React.act(() => update('@fixture/ui:After'));
    expect(rendered.container.querySelector('[data-component]')).to.equal(root);
    expect(root.getAttribute('data-component')).to.eql('@fixture/ui:After');
    const after = expectPalette(root, '@fixture/ui:After', Color.theme('Light'));
    expect(after.some((name) => before.includes(name))).to.eql(false);
  });

  it('internal resolved foreground → alpha is set, not multiplied by inherited alpha', async () => {
    const theme = { ...Color.theme('Light'), fg: 'rgba(48, 112, 180, 0.35)' };
    using rendered = await TestReact.render(
      <ScopedRoot component='@fixture/ui:Alpha' theme={theme} />,
    );
    expectPalette(
      rendered.container.querySelector('[data-component]')!,
      '@fixture/ui:Alpha',
      theme,
    );
  });

  it('child layout observer → invariant rule is already registered on the initial commit', async () => {
    const component = '@fixture/ui:Timing';
    function Observer() {
      React.useLayoutEffect(() => {
        expect(descendantRules(component).length).to.eql(1);
      }, []);
      return <code>initial child</code>;
    }
    using rendered = await TestReact.render(
      <ScopedRoot component={component} theme={Color.theme('Light')}>
        <Observer />
      </ScopedRoot>,
    );
    expect(rendered.container.querySelectorAll('code').length).to.eql(1);
  });
});

/**
 * Helpers:
 */
function descendantRules(component: string) {
  const selector = `[data-component="${component}"] code`;
  return Style.Dom.stylesheet().rules.items.filter((rule) => rule.selector === selector);
}

/** Inspect the connected CSSOM as well as the exact serialized insertion input. */
function attachedRules() {
  const sheet = Style.Dom.stylesheet();
  const element = document.head.querySelector<HTMLStyleElement>(
    `style[data-controller="${sheet.id}"]`,
  )!;
  expect(element.isConnected).to.eql(true);
  // CSSOM interop: this fixture inserts only ordinary style rules.
  return Array.from(element.sheet!.cssRules) as CSSStyleRule[];
}

function rootProperties(root: Element) {
  const properties: Record<string, string> = {};
  for (const rule of attachedRules().filter((rule) => root.matches(rule.selectorText))) {
    for (const name of Array.from(rule.style)) properties[name] = rule.style.getPropertyValue(name);
  }
  return properties;
}

function expectPalette(root: Element, component: string, theme: t.Color.Theme) {
  const emitted = descendantRules(component);
  expect(emitted.length).to.eql(1);
  const { rule } = emitted[0];
  const references = Array.from(rule.matchAll(/var\((--[^)]+)\)/g), (match) => match[1]);
  expect(references.length).to.eql(3);
  expect(new Set(references).size).to.eql(3);
  const values = rootProperties(root);
  const bySuffix = (suffix: string) => references.find((name) => name.endsWith(suffix))!;
  expect(values[bySuffix('-fg')]).to.eql(Color.alpha(theme.fg, 0.8));
  expect(values[bySuffix('-bg')]).to.eql(Color.alpha(theme.fg, 0.03));
  expect(values[bySuffix('-border')]).to.eql(Color.alpha(theme.fg, 0.15));
  for (const name of references) {
    expect(name).to.match(/^--scoped-\d+-(fg|bg|border)$/);
  }
  const cssom = attachedRules().find((item) => item.selectorText === emitted[0].selector)!;
  expect(cssom.style.getPropertyValue('color')).to.eql(`var(${bySuffix('-fg')})`);
  expect(cssom.style.getPropertyValue('background-color')).to.eql(`var(${bySuffix('-bg')})`);
  // The DOM mock drops var(...) border shorthands; assert emitted text, leaving paint to browsers.
  expect(rule).to.include(`border: solid 1px var(${bySuffix('-border')});`);
  for (
    const declaration of [
      'font-family: monospace;',
      'font-weight: 600;',
      'font-size: 0.85em;',
      'line-height: 1;',
      'padding-top: 2px;',
      'padding-right: 4px;',
      'padding-bottom: 2px;',
      'padding-left: 4px;',
      'border-radius: 4px;',
    ]
  ) {
    expect(rule).to.include(declaration);
  }
  return references;
}
