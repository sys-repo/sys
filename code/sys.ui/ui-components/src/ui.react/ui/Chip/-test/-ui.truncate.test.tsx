import { useState } from 'react';
import {
  act,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  TestReact,
} from '../../../-test.ts';
import { css, D, Is, Style, type t } from '../common.ts';
import { Chip } from '../mod.ts';
import { Overflow } from '../-spec/-ui.Overflow.tsx';

type State = { truncate: boolean; text: string };
const text = '/-sample/not-a-real-path/long-directory-name/example.bundle.js.map';

// DOM and style intent only. Line placement, visible ellipsis and baselines need a real browser.
describe('Chip: opt-in bounded ellipsis', () => {
  DomMock.init({ beforeAll, afterAll });

  it('public contract → optional boolean with an opt-out default', () => {
    expect(D.truncate).to.eql(false);
    expectTypeOf<t.Chip.Props['truncate']>(undefined).toEqualTypeOf<boolean | undefined>();
    // @ts-expect-error Truncation is a flag, not a width or host policy.
    expectTypeOf<t.Chip.Props>({ truncate: 180 });
  });

  it('omitted and false → identical intrinsic, unclipped output', async () => {
    const res = await TestReact.render(
      <>
        <Chip.UI>{text}</Chip.UI>
        <Chip.UI truncate={false}>{text}</Chip.UI>
      </>,
    );
    try {
      const [implicit, explicit] = chips(res.container);
      expect(implicit.outerHTML).to.eql(explicit.outerHTML);
      expect(implicit.textContent).to.eql(text);
      expect(implicit.childElementCount).to.eql(0);
      const rule = ruleText(implicit);
      expect(rule).to.include('display: inline-block;');
      expect(rule).to.include('white-space: nowrap;');
      expect(rule).to.include('vertical-align: baseline;');
      const paint = 'background-color: color-mix(in srgb, currentColor 6%, transparent);';
      expect(rule).to.include(paint);
      for (const property of ['max-width:', 'overflow:', 'text-overflow:']) {
        expect(rule).not.to.include(property);
      }
    } finally {
      act(() => res.dispose());
    }
  });

  it('true → declares a bounded baseline-sharing grid with one clipping item', async () => {
    const res = await TestReact.render(
      <div style={{ width: 180 }}>
        <Chip.UI truncate>{text}</Chip.UI>
        <Chip.UI truncate>
          <code className={css({ font: 'inherit' }).class}>{text}</code>
        </Chip.UI>
      </div>,
    );
    try {
      for (const chip of chips(res.container)) {
        const rule = ruleText(chip);
        expect(rule).to.include('display: inline-grid;');
        expect(rule).to.include('grid-template-columns: minmax(0, 1fr);');
        expect(rule).to.include('max-width: 100%;');
        expect(rule).to.include('box-sizing: border-box;');
        expect(rule).to.include('white-space: nowrap;');
        expect(rule).to.include('vertical-align: baseline;');
        expect(rule).not.to.include('overflow: hidden;');
        const owners = ellipsisOwners(chip);
        expect(owners.length).to.eql(1);
        expect(ruleText(owners[0])).to.include('overflow: hidden;');
        expect(chip.textContent).to.eql(text);
        expect(chip.hasAttribute('truncate')).to.eql(false);
        const selector = '[tabindex], a, button, [role], [aria-label], [title]';
        expect(chip.querySelector(selector)).to.eql(null);
        for (const name of ['tabindex', 'role', 'aria-label', 'title']) {
          expect(chip.hasAttribute(name)).to.eql(false);
        }
      }
      expect(res.container.querySelector('code')?.textContent).to.eql(text);
    } finally {
      act(() => res.dispose());
    }
  });

  it('outer-owner fixtures → inline tokens with one ancestor clipping owner', async () => {
    const res = await TestReact.render(<Overflow width={180} fontSize={12} truncate />);
    try {
      const sections = [...res.container.querySelectorAll<HTMLElement>('section')];
      for (const section of sections.slice(5, 8)) {
        const host = section.lastElementChild;
        if (Is.nil(host)) throw new Error('Missing specimen line.');
        const [chip] = chips(section);
        expect(ruleText(chip)).to.include('display: inline;');
        expect(chip.textContent).to.eql(text);
        expect(ellipsisOwners(chip)).to.eql([]);
        const owners = ellipsisOwners(host);
        expect(owners.length).to.eql(1);
        expect(owners[0].contains(chip)).to.eql(true);
      }
      const anchor = sections[7].querySelector('a');
      expect(anchor?.getAttribute('href')).to.eql('#chip-overflow');
    } finally {
      act(() => res.dispose());
    }
  });

  it('true → preserves default token paint and typography across sizes, mono and themes', async () => {
    const themes = [undefined, 'Light', 'Dark'] as const;
    const sizes = ['xs', 'sm', 'md'] as const;
    const keys = [
      'color',
      'fontSize',
      'lineHeight',
      'verticalAlign',
      'backgroundColor',
      'border',
      'borderRadius',
      'padding',
      'backgroundClip',
      'outline',
    ] as const;
    for (const theme of themes) {
      for (const size of sizes) {
        for (const mono of [true, false]) {
          const props = { theme, size, mono, debug: true };
          const res = await TestReact.render(
            <>
              <Chip.UI {...props}>{text}</Chip.UI>
              <Chip.UI {...props} truncate>{text}</Chip.UI>
            </>,
          );
          try {
            const [normal, bounded] = chips(res.container).map(rule);
            expect(normal.style.fontFamily).to.eql(mono ? 'monospace' : undefined);
            expect(bounded.style.fontFamily).to.eql(normal.style.fontFamily);
            for (const key of keys) {
              expect(normal.style[key], key).not.to.eql(undefined);
              expect(bounded.style[key], key).to.eql(normal.style[key]);
            }
          } finally {
            act(() => res.dispose());
          }
        }
      }
    }
  });

  it('caller styles → override or clear the root bound', async () => {
    const override = { maxWidth: 96, padding: '2px 6px' } satisfies t.CssValue;
    const inputs = [override, css(override)] as const;
    for (const style of inputs) {
      const res = await TestReact.render(<Chip.UI truncate style={style}>{text}</Chip.UI>);
      try {
        const rule = ruleText(chips(res.container)[0]);
        expect(rule).to.include('max-width: 96px;');
        expect(rule).to.include('padding: 2px 6px;');
        expect(rule).not.to.include('max-width: 100%;');
      } finally {
        act(() => res.dispose());
      }
    }
    const res = await TestReact.render(
      <Chip.UI truncate style={[false, [{ maxWidth: undefined }]]}>{text}</Chip.UI>,
    );
    try {
      expect(ruleText(chips(res.container)[0])).not.to.include('max-width:');
    } finally {
      act(() => res.dispose());
    }
  });

  it('toggle and content changes → preserve root identity and complete current text', async () => {
    let update: (value: State) => void = () => {
      throw new Error('Not mounted.');
    };
    function Example() {
      const [value, setValue] = useState<State>({ truncate: D.truncate, text });
      update = setValue;
      return (
        <Chip.UI truncate={value.truncate}>
          <code>{value.text}</code>
        </Chip.UI>
      );
    }
    const res = await TestReact.render(<Example />);
    try {
      const root = chips(res.container)[0];
      for (const truncate of [true, false, true]) {
        const value = truncate ? `${text} updated` : 'Esc';
        act(() => update({ truncate, text: value }));
        expect(chips(res.container)[0]).to.equal(root);
        expect(root.textContent).to.eql(value);
        expect(root.querySelector('code')?.textContent).to.eql(value);
        expect(ellipsisOwners(root).length).to.eql(truncate ? 1 : 0);
        expect(ruleText(root).includes('max-width: 100%;')).to.eql(truncate);
      }
    } finally {
      act(() => res.dispose());
    }
  });
});

/**
 * Helpers:
 */
function chips(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(`[data-component="${D.displayName}"]`)];
}

function rule(element: Element) {
  const result = Style.Dom.stylesheet().rules.items.find((item) => {
    return item.selector === `.${element.className}`;
  });
  if (Is.nil(result)) throw new Error(`Missing CSS rule: ${element.className}`);
  return result;
}

function ruleText(element: Element) {
  return rule(element).rule;
}

function ellipsisOwners(root: Element) {
  return [root, ...root.querySelectorAll<HTMLElement>('[class]')].filter((element) => {
    return ruleText(element).includes('text-overflow: ellipsis;');
  });
}
