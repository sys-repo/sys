import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Html } from '@sys/html';
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
import { A, Anchor } from '../mod.ts';

const href = 'https://example.com';
const variants = [{ name: 'Anchor.UI', UI: A }, { name: 'Anchor.Link', UI: Anchor.Link }] as const;

// Declarations and DOM only; actual ellipsis and focus geometry require browser verification.
describe('Anchor: opt-in truncation', () => {
  DomMock.init({ beforeAll, afterAll });

  it('public types admit only an optional boolean; the default is false', () => {
    expect(D.truncate).to.eql(false);
    expectTypeOf<t.Anchor.Props['truncate']>(undefined).toEqualTypeOf<boolean | undefined>();
    expectTypeOf<t.Anchor.Link.Props['truncate']>(undefined).toEqualTypeOf<boolean | undefined>();
    // @ts-expect-error Truncation is a flag, not a width or alternate policy.
    expectTypeOf<t.Anchor.Props>({ truncate: 180 });
  });

  for (const { name, UI } of variants) {
    for (const enabled of [true, false]) {
      it(`${name} / enabled=${enabled} → omitted and false retain the same inline output`, async () => {
        const res = await TestReact.render(
          <>
            <UI href={href} enabled={enabled}>
              A <strong>rich</strong> label
            </UI>
            <UI href={href} enabled={enabled} truncate={false}>
              A <strong>rich</strong> label
            </UI>
          </>,
        );
        try {
          const [defaultLink, explicitFalse] = res.container.querySelectorAll('a');
          expect(explicitFalse.outerHTML).to.eql(defaultLink.outerHTML);
          const rule = ruleText(defaultLink);
          for (const declaration of ['display:', 'overflow:', 'white-space:', 'text-overflow:']) {
            expect(rule).not.to.include(declaration);
          }
        } finally {
          act(() => res.dispose());
        }
      });

      it(`${name} / enabled=${enabled} → truncate emits one recipe without changing interaction`, async () => {
        let clicks = 0;
        const res = await TestReact.render(
          <UI
            href={href}
            enabled={enabled}
            truncate
            style={{ width: 180 }}
            onClick={(e) => {
              e.preventDefault();
              clicks++;
            }}
          >
            A <strong>rich</strong> label
          </UI>,
        );
        try {
          const root = anchor(res.container);
          const rule = ruleText(root);
          expect(res.container.querySelectorAll('a').length).to.eql(1);
          expect(rule).to.include('display: inline-block;');
          expect(rule).to.include('width: 180px;');
          expect(rule).to.include('overflow: hidden;');
          expect(rule).to.include('white-space: nowrap;');
          expect(rule).to.include('text-overflow: ellipsis;');
          expect(root.textContent).to.eql('A rich label');
          expect(root.querySelector('strong')?.textContent).to.eql('rich');
          expect(root.hasAttribute('truncate')).to.eql(false);
          expect(root.hasAttribute('title')).to.eql(false);
          expect(root.hasAttribute('href')).to.eql(enabled);
          expect(root.tabIndex).to.eql(enabled ? 0 : -1);
          const click = DomMock.Mouse.click(root);
          expect(click.event.defaultPrevented).to.eql(true);
          expect(clicks).to.eql(enabled ? 1 : 0);
        } finally {
          act(() => res.dispose());
        }
      });
    }

    it(`${name} → missing destinations return original children even with truncate`, async () => {
      for (const destination of [undefined, '']) {
        const res = await TestReact.render(
          <UI href={destination} enabled={false} truncate style={{ width: 180 }}>
            <strong>Original label</strong>
          </UI>,
        );
        try {
          expect(res.container.innerHTML).to.eql('<strong>Original label</strong>');
        } finally {
          act(() => res.dispose());
        }
      }
    });

    it(`${name} → caller styles override the recipe; raw declaration clears survive composition`, async () => {
      const override: t.CssValue = {
        display: 'block',
        overflow: 'visible',
        whiteSpace: 'normal',
        textOverflow: 'clip',
      };
      const inputs: { style: t.CssInput; cleared: boolean }[] = [
        { style: override, cleared: false },
        { style: css(override), cleared: false },
        { style: [false, [{ display: undefined, textOverflow: undefined }]], cleared: true },
      ];
      for (const enabled of [true, false]) {
        for (const { style, cleared } of inputs) {
          const res = await TestReact.render(
            <UI href={href} enabled={enabled} truncate style={style}>Label</UI>,
          );
          try {
            const rule = ruleText(anchor(res.container));
            expect(rule).not.to.include('display: inline-block;');
            expect(rule).not.to.include('text-overflow: ellipsis;');
            if (cleared) {
              expect(rule).not.to.include('display:');
              expect(rule).not.to.include('text-overflow:');
              expect(rule).to.include('overflow: hidden;');
              expect(rule).to.include('white-space: nowrap;');
            } else {
              expect(rule).to.include('display: block;');
              expect(rule).to.include('overflow: visible;');
              expect(rule).to.include('white-space: normal;');
              expect(rule).to.include('text-overflow: clip;');
            }
          } finally {
            act(() => res.dispose());
          }
        }
      }
    });
  }

  it('semantic truncate transitions preserve native identity, markers, hints and caller focus ownership', async () => {
    let update: (truncate: boolean) => void = () => {
      throw new Error('Not mounted.');
    };
    function Example() {
      const [truncate, setTruncate] = useState(false);
      update = setTruncate;
      return (
        <Anchor.Link
          href={href}
          resource='web'
          openIn='new-tab'
          truncate={truncate}
          style={{ maxWidth: 180, ':focus-visible': undefined }}
        >
          A <strong>rich</strong> label
        </Anchor.Link>
      );
    }
    const res = await TestReact.render(<Example />);
    try {
      const root = anchor(res.container);
      const markers = [...root.querySelectorAll('svg')];
      const hint = root.nextElementSibling!;
      expect(markers.length).to.eql(2);
      expect(hint.textContent).to.eql(D.link.openHint);
      expect(hint.hasAttribute('hidden')).to.eql(true);
      for (const truncate of [true, false, true]) {
        act(() => update(truncate));
        expect(anchor(res.container)).to.equal(root);
        const currentMarkers = root.querySelectorAll('svg');
        expect(currentMarkers.length).to.eql(markers.length);
        for (const [index, marker] of markers.entries()) {
          expect(currentMarkers[index]).to.equal(marker);
        }
        expect(root.nextElementSibling).to.equal(hint);
        expect(root.getAttribute('aria-describedby')).to.eql(hint.id);
        expect(root.getAttribute('target')).to.eql('_blank');
        expect(root.rel).to.eql('noopener noreferrer');
        const rule = ruleText(root);
        expect(rule).to.include('max-width: 180px;');
        expect(rule.includes('text-overflow: ellipsis;')).to.eql(truncate);
        const focusSelector = `.${root.className}:focus-visible`;
        const rules = Style.Dom.stylesheet().rules.items;
        const focus = rules.find((item) => item.selector === focusSelector);
        expect(focus).to.eql(undefined);
      }
    } finally {
      act(() => res.dispose());
    }
  });

  it('truncate → SSR preserves rich phrasing content and one native anchor within prose', () => {
    const markup = renderToStaticMarkup(
      <p>
        Before{' '}
        <Anchor.Link href={href} resource='web' truncate style={{ width: 180 }}>
          A <strong>rich</strong> label
        </Anchor.Link>{' '}
        after.
      </p>,
    );
    const fragment = Html.parseFragment(markup);
    expect(fragment.childNodes.length).to.eql(1);
    const paragraph = fragment.childNodes[0];
    if (!Html.Is.element(paragraph)) throw new Error('Expected paragraph.');
    expect(paragraph.tagName).to.eql('p');
    const elements = paragraph.childNodes.filter(Html.Is.element);
    expect(elements.map((element) => element.tagName)).to.eql(['a']);
    expect(markup).not.to.include('<div');
    expect(markup).not.to.include('…');
  });
});

/**
 * Helpers:
 */
function anchor(container: HTMLElement) {
  const root = container.querySelector<HTMLAnchorElement>('a');
  if (Is.nil(root)) throw new Error('Expected anchor.');
  return root;
}

function ruleText(element: Element) {
  const rule = Style.Dom.stylesheet().rules.items.find((item) => {
    return item.selector === `.${element.className}`;
  });
  if (Is.nil(rule)) throw new Error(`Missing CSS rule: ${element.className}`);
  return rule.rule;
}
