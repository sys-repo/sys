import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  TestReact,
} from '../../../-test.ts';
import { Color, css, Is, Style, type t } from '../common.ts';
import { A } from '../mod.ts';
import { Button } from '../../Button/mod.ts';

const href = 'https://example.com';

describe('Anchor: focus styling', () => {
  DomMock.init({ beforeAll, afterAll });

  for (const theme of ['Light', 'Dark'] as const) {
    it(`${theme}: composes outline and underline without changing inline markup or layout`, async () => {
      const res = await TestReact.render(
        <p>
          Before <A href={href} theme={theme}>a link that can wrap across lines</A> after.
        </p>,
      );
      try {
        const root = anchor(res.container);
        const base = declarations(root);
        const focus = declarations(root, ':focus-visible');
        expect(root.tagName).to.eql('A');
        expect(root.parentElement?.tagName).to.eql('P');
        expect(root.childElementCount).to.eql(0);
        expect(root.getAttribute('href')).to.eql(href);
        expect(root.hasAttribute('role')).to.eql(false);
        expect(root.hasAttribute('tabindex')).to.eql(false);
        expect(base).to.include({ color: 'inherit', textUnderlineOffset: '3px', borderRadius: 1 });
        for (const property of ['display', 'padding', 'border', 'overflow', 'whiteSpace']) {
          expect(base).not.to.have.property(property);
        }
        expect(base?.textDecoration).to.include('underline dashed');
        expect(declarations(root, ':hover')?.textDecoration).to.eql('underline solid currentColor');
        expect(focus).to.include({
          outline: 'var(--sys-anchor-focus-width) solid var(--sys-anchor-focus-rest)',
          outlineOffset: 'var(--sys-anchor-focus-offset)',
          textDecoration: 'underline solid currentColor',
          animation: '220ms ease-out 70ms 1 normal backwards running var(--sys-focus-animation)',
        });
        expect(base).to.include({
          '--sys-anchor-focus-accent': Color.BLUE,
          '--sys-anchor-focus-rest': Color.alpha(Color.BLUE, 0.2),
          '--sys-anchor-focus-width': '2px',
          '--sys-anchor-focus-offset': '2px',
        });
        expect(base?.['--sys-focus-arrival-outline']).to.eql('var(--sys-anchor-focus-accent)');
        expect(base?.['--sys-focus-animation']).to.eql('sys-focus-arrival-outline');
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('matches Button arrival, resting palette, geometry and animation policy', async () => {
    const res = await TestReact.render(
      <div>
        <Button>Button</Button>
        <A href={href}>Anchor</A>
      </div>,
    );
    try {
      const link = anchor(res.container);
      const button = res.container.querySelector('[role="button"]')!;
      const linkBase = declarations(link);
      const buttonBase = declarations(button);
      expect(linkBase?.borderRadius).to.eql(buttonBase?.borderRadius);
      for (const token of ['accent', 'rest', 'width', 'offset']) {
        expect(linkBase?.[`--sys-anchor-focus-${token}`]).to.eql(
          buttonBase?.[`--sys-button-focus-${token}`],
        );
      }
      expect(linkBase?.['--sys-focus-animation']).to.eql(buttonBase?.['--sys-focus-animation']);
      const linkFocus = declarations(link, ':focus-visible');
      const buttonFocus = declarations(button, ':focus-visible');
      for (const property of ['outline', 'outlineOffset', 'animation'] as const) {
        const value = buttonFocus?.[property];
        if (!Is.string(value)) throw new Error(`Expected Button focus ${property}.`);
        expect(linkFocus?.[property]).to.eql(value.replaceAll('--sys-button-', '--sys-anchor-'));
      }
      for (const property of ['arrival-outline', 'forced-outline', 'forced-offset']) {
        const value = buttonBase?.[`--sys-focus-${property}`];
        if (!Is.string(value)) throw new Error(`Expected Button ${property}.`);
        expect(linkBase?.[`--sys-focus-${property}`]).to.eql(
          value.replaceAll('--sys-button-', '--sys-anchor-'),
        );
      }
      expect(linkFocus?.textDecoration).to.eql('underline solid currentColor');
      expect(buttonFocus).not.to.have.property('textDecoration');
    } finally {
      act(() => res.dispose());
    }
  });

  it('registers reduced-motion and forced-colour policy on the final caller-styled class', async () => {
    const res = await TestReact.render(<A href={href} style={{ margin: 7 }}>Link</A>);
    try {
      const root = anchor(res.container);
      const selector = `.${root.className}`;
      expect(declarations(root)?.margin).to.eql(7);
      expect(declarations(root)).to.include({
        '--sys-focus-forced-outline': 'var(--sys-anchor-focus-width) solid Highlight',
        '--sys-focus-forced-offset': 'var(--sys-anchor-focus-offset)',
      });
      expect(mediaRules(root).map((item) => item.rule)).to.eql([
        `@media (prefers-reduced-motion: reduce) { ${selector} { --sys-focus-animation: none; } }`,
        `@media (forced-colors: active) { ${selector} { --sys-focus-animation: none; } }`,
        `@media (forced-colors: active) { ${selector}:focus-visible { outline: var(--sys-focus-forced-outline); outline-offset: var(--sys-focus-forced-offset); } }`,
      ]);
    } finally {
      act(() => res.dispose());
    }
  });

  const custom = { outline: '3px dotted red', outlineOffset: '0px' };
  const replacements: {
    name: string;
    style: () => t.CssInput;
    expected?: t.Style.Props;
  }[] = [
    { name: 'plain', style: () => ({ ':focus-visible': custom }), expected: custom },
    { name: 'nested', style: () => [false, [{ ':focus-visible': custom }]], expected: custom },
    { name: 'transformed', style: () => css({ ':focus-visible': custom }), expected: custom },
    { name: 'empty', style: () => ({ ':focus-visible': {} }), expected: {} },
    { name: 'clear', style: () => ({ ':focus-visible': undefined }) },
    {
      name: 'nested template clear',
      style() {
        return [
          { minWidth: 120, ':focus-visible': custom },
          [false, { Padding: 4, minWidth: undefined, ':focus-visible': undefined }],
        ];
      },
    },
  ];
  for (const { name, style, expected } of replacements) {
    it(`${name}: caller focus replaces the outline, underline and shared policy together`, async () => {
      const res = await TestReact.render(<A href={href} style={style()}>Link</A>);
      try {
        const root = anchor(res.container);
        const base = declarations(root);
        expect(declarations(root, ':focus-visible')).to.eql(expected);
        expect(base).not.to.have.property('--sys-anchor-focus-rest');
        expect(base).not.to.have.property('--sys-focus-animation');
        expect(base).not.to.have.property('--sys-focus-arrival-outline');
        expect(base).not.to.have.property('--sys-focus-forced-outline');
        expect(mediaRules(root)).to.eql([]);
        expect(base?.textDecoration).to.include('underline dashed');
        expect(base?.borderRadius).to.eql(1);
        if (name === 'nested template clear') {
          expect(base).to.include({ paddingTop: 4, paddingBottom: 4 });
          expect(base).not.to.have.property('minWidth');
        }
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('caller radius overrides and template clears survive custom focus replacement', async () => {
    for (const borderRadius of [0, 6, undefined]) {
      const customFocus = { outline: '3px solid red' };
      const res = await TestReact.render(
        <A href={href} style={{ Padding: 4, borderRadius, ':focus-visible': customFocus }}>Link</A>,
      );
      try {
        const root = anchor(res.container);
        expect(declarations(root)?.borderRadius).to.eql(borderRadius);
        expect(declarations(root, ':focus-visible')).to.eql(customFocus);
        if (Is.nil(borderRadius)) expect(declarations(root)).not.to.have.property('borderRadius');
      } finally {
        act(() => res.dispose());
      }
    }
  });

  for (const pseudo of ['', ':hover'] as const) {
    it(`preserves caller ${pseudo || 'root'} animation without adding competing focus motion`, async () => {
      const animation = 'caller-pulse 2s linear infinite';
      const style: t.CssInput = pseudo ? { ':hover': { animation } } : { animation };
      const res = await TestReact.render(<A href={href} style={style}>Link</A>);
      try {
        const root = anchor(res.container);
        expect(declarations(root, pseudo)?.animation).to.eql(animation);
        expect(declarations(root, ':focus-visible')?.animation).to.eql(undefined);
        expect(declarations(root, ':focus-visible')).to.include({
          textDecoration: 'underline solid currentColor',
          outline: 'var(--sys-anchor-focus-width) solid var(--sys-anchor-focus-rest)',
        });
      } finally {
        act(() => res.dispose());
      }
    });
  }

  it('disabled and missing-href branches do not acquire the focus treatment', async () => {
    const res = await TestReact.render(
      <div>
        <A href={href} enabled={false}>Disabled</A>
        <A href=''>Plain text</A>
      </div>,
    );
    try {
      const root = anchor(res.container);
      expect(res.container.querySelectorAll('a').length).to.eql(1);
      expect(root.tabIndex).to.eql(-1);
      expect(root.getAttribute('aria-disabled')).to.eql('true');
      expect(root.hasAttribute('href')).to.eql(false);
      expect(declarations(root, ':focus-visible')).to.eql(undefined);
      expect(declarations(root)).not.to.have.property('--sys-focus-animation');
      expect(mediaRules(root)).to.eql([]);
      expect(root.parentElement?.textContent).to.eql('DisabledPlain text');
    } finally {
      act(() => res.dispose());
    }
  });
});

/** These helpers inspect declarations, not browser matching, geometry, or animation replay. */
function anchor(container: HTMLElement) {
  const root = container.querySelector<HTMLAnchorElement>('a');
  if (Is.nil(root)) throw new Error('Expected Anchor.');
  return root;
}

function declarations(root: Element, pseudo = '') {
  return Style.Dom.stylesheet().rules.items.find((item) => {
    return item.selector === `.${root.className}${pseudo}` && !item.rule.startsWith('@media');
  })?.style;
}

function mediaRules(root: Element) {
  const selectors = [`.${root.className}`, `.${root.className}:focus-visible`];
  return Style.Dom.stylesheet().rules.items.filter((item) => {
    return selectors.includes(item.selector) && item.rule.startsWith('@media');
  });
}
