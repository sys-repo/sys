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
import { Anchor } from '../../Anchor/mod.ts';
import { D as ChipDefaults } from '../../Chip/common.ts';
import { D, Is, Style, type t } from '../common.ts';
import { TextLabel } from '../mod.ts';

type State = Pick<t.TextLabel.Props, 'value' | 'overflow'>;
const token = '/-sample/long-directory-name/example.bundle.js.map';
const value = `Run **build** with \`${token}\` now.`;

describe('Text.Label: DOM and clipping ownership', () => {
  DomMock.init({ beforeAll, afterAll });

  it('public contract → required string and explicit three-way owner', () => {
    expect(D.overflow).to.eql('flow');
    expectTypeOf<t.TextLabel.Props['overflow']>(undefined).toEqualTypeOf<
      t.TextLabel.Overflow | undefined
    >();
    // @ts-expect-error Labels require an authored string.
    expectTypeOf<t.TextLabel.Props>({});
    // @ts-expect-error Layout policy is not a boolean truncation alias.
    expectTypeOf<t.TextLabel.Props>({ value, overflow: true });
  });

  it('flow → inherited typography, complete text and Chip-owned clipping only', async () => {
    const res = await TestReact.render(<TextLabel.UI value={value} />);
    try {
      const root = label(res.container);
      expect(root.tagName).to.eql('SPAN');
      expect(root.textContent).to.eql(`Run build with ${token} now.`);
      expect(root.querySelector('strong')?.textContent).to.eql('build');
      const chip = root.querySelector<HTMLElement>(
        `[data-component="${ChipDefaults.displayName}"]`,
      );
      if (Is.nil(chip)) throw new Error('Missing Chip.');
      expect(root.querySelector('code')?.textContent).to.eql(token);
      expect(ruleText(chip)).to.include('font-family: monospace;');
      expect(ruleText(chip)).to.include('display: inline-grid;');
      const code = root.querySelector('code');
      if (Is.nil(code)) throw new Error('Missing code semantics.');
      expect(ruleText(code)).to.include('font: inherit;');
      expect(owners(root).length).to.eql(1);
      expect(chip.contains(owners(root)[0])).to.eql(true);
      const rule = ruleText(root);
      const inherited = [
        'color:',
        'font-',
        'line-height:',
        'white-space:',
        'padding:',
        'overflow:',
      ];
      for (const property of inherited) {
        expect(rule, property).not.to.include(property);
      }
      const forbidden = 'a, button, input, img, br, p, div, [tabindex], [role]';
      expect(root.querySelector(forbidden)).to.eql(null);
      for (const element of [root, ...root.querySelectorAll('*')]) {
        for (const name of ['title', 'aria-label', 'tabindex', 'role']) {
          expect(element.hasAttribute(name), name).to.eql(false);
        }
      }
    } finally {
      act(() => res.dispose());
    }
  });

  it('truncate and host → inline Chips, one explicit outer owner including code-only labels', async () => {
    for (const value of [`\`${token}\``, `Run \`${token}\` now.`]) {
      for (const overflow of ['truncate', 'host'] as const) {
        const content = <TextLabel.UI value={value} overflow={overflow} />;
        const res = await TestReact.render(
          overflow === 'host'
            ? <Anchor.Link href='#label-test' truncate>{content}</Anchor.Link>
            : content,
        );
        try {
          const root = label(res.container);
          const chip = root.querySelector<HTMLElement>(
            `[data-component="${ChipDefaults.displayName}"]`,
          );
          if (Is.nil(chip)) throw new Error('Missing Chip.');
          expect(ruleText(chip)).to.include('display: inline;');
          expect(owners(chip)).to.eql([]);
          expect(owners(res.container).length).to.eql(1);
          expect(root.querySelector('code')?.textContent).to.eql(token);
          if (overflow === 'truncate') {
            expect(owners(root)[0]).to.equal(root);
            expect(ruleText(root)).to.include('max-width: 100%;');
            expect(ruleText(root)).to.include('white-space: nowrap;');
          } else {
            expect(owners(root)).to.eql([]);
            expect(res.container.querySelector('a')?.getAttribute('href')).to.eql('#label-test');
          }
        } finally {
          act(() => res.dispose());
        }
      }
    }
  });

  it('caller style → last override, including removal of the default bound', async () => {
    const res = await TestReact.render(
      <TextLabel.UI
        value={value}
        overflow='truncate'
        style={[{ maxWidth: 180 }, { maxWidth: undefined, width: 120, color: 'red' }]}
      />,
    );
    try {
      const rule = ruleText(label(res.container));
      expect(rule).to.include('width: 120px;');
      expect(rule).to.include('color: red;');
      expect(rule).not.to.include('max-width:');
    } finally {
      act(() => res.dispose());
    }
  });

  it('content and owner transitions → same root, current complete text, no stale formatting', async () => {
    let update: (value: State) => void = () => {
      throw new Error('Not mounted.');
    };
    function Example() {
      const [state, setState] = useState<State>({ value });
      update = setState;
      return <TextLabel.UI {...state} />;
    }
    const res = await TestReact.render(<Example />);
    try {
      const root = label(res.container);
      for (const overflow of ['truncate', 'host', 'flow'] as const) {
        act(() => update({ value: `**New** \`${token}\``, overflow }));
        expect(label(res.container)).to.equal(root);
        expect(root.textContent).to.eql(`New ${token}`);
        expect(owners(root).length).to.eql(overflow === 'host' ? 0 : 1);
      }
      for (const value of ['# **literal**', '', 'plain']) {
        act(() => update({ value }));
        expect(label(res.container)).to.equal(root);
        expect(root.textContent).to.eql(value);
        expect(root.querySelector('strong, code')).to.eql(null);
      }
    } finally {
      act(() => res.dispose());
    }
  });
});

function label(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>(`[data-component="${D.displayName}"]`);
  if (Is.nil(root)) throw new Error('Missing Text.Label.');
  return root;
}

function ruleText(element: Element) {
  return Style.Dom.stylesheet().rules.items.find((item) => {
    return item.selector === `.${element.className}`;
  })?.rule ?? '';
}

function owners(container: Element) {
  return [container, ...container.querySelectorAll('[class]')].filter((element) => {
    return ruleText(element).includes('text-overflow: ellipsis;');
  });
}
