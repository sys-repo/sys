import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LuArrowRight, LuArrowUpRight } from 'react-icons/lu';
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
import { Color, D, Is, Style, type t } from '../common.ts';
import { A, Anchor } from '../mod.ts';

type Props = t.Anchor.Link.Props;
const { Link } = Anchor;
const href = '#destination';

describe('Anchor.Link', () => {
  DomMock.init({ beforeAll, afterAll });

  it('public leaf and type surface → semantic variant without changing A identity', async () => {
    const leaf = await import('@sys/ui-components/react/anchor');
    expect(leaf.Anchor.Link).to.equal(Link);
    expect(leaf.A).to.equal(A);
    expect(A).to.equal(Anchor.UI);
    expect(Link).not.to.equal(A);
    expectTypeOf<Props>({ children: 'Label', resource: 'web', openIn: 'new-tab' })
      .toMatchTypeOf<t.Anchor.Props>();
    // @ts-expect-error A semantic label is required, even though ReactNode admits empty values.
    expectTypeOf<Props>({ href });
    // @ts-expect-error Raw target belongs to Anchor.UI.
    expectTypeOf<Props>({ children: 'Label', target: '_blank' });
    // @ts-expect-error Download belongs to Anchor.UI.
    expectTypeOf<Props>({ children: 'Label', download: true });
    // @ts-expect-error Generic icons belong to Anchor.UI.
    expectTypeOf<Props>({ children: 'Label', icons: {} });
    // @ts-expect-error Availability belongs to enabled.
    expectTypeOf<Props>({ children: 'Label', 'aria-disabled': true });
    // @ts-expect-error Resource is not an origin or transport taxonomy.
    expectTypeOf<Props>({ children: 'Label', resource: 'external' });
    // @ts-expect-error Named contexts belong to Anchor.UI.
    expectTypeOf<Props>({ children: 'Label', openIn: 'preview-pane' });
  });

  for (const resource of [undefined, 'web'] as const) {
    for (const enabled of [true, false]) {
      for (const openIn of [undefined, 'self', 'new-tab'] as const) {
        it(`${resource ?? 'no resource'} / ${enabled} / ${openIn ?? 'default'} → coherent availability`, async () => {
          const res = await TestReact.render(
            <Link href={href} resource={resource} enabled={enabled} openIn={openIn}>
              The <em>destination</em>
            </Link>,
          );
          try {
            const root = anchor(res.container);
            const newContext = enabled && openIn === 'new-tab';
            const expectedTarget = enabled ? (newContext ? '_blank' : '_self') : null;
            expect(res.container.querySelectorAll('a').length).to.eql(1);
            expect(root.textContent).to.eql('The destination');
            expect(root.querySelector('em')?.textContent).to.eql('destination');
            expect(root.hasAttribute('href')).to.eql(enabled);
            expect(root.getAttribute('target')).to.eql(expectedTarget);
            expect(root.getAttribute('aria-disabled')).to.eql(enabled ? null : 'true');
            expect(root.tabIndex).to.eql(enabled ? 0 : -1);
            const markers = root.querySelectorAll('[aria-hidden="true"]');
            expect(markers.length).to.eql((resource ? 1 : 0) + (enabled ? 1 : 0));
            expect(root.querySelectorAll('svg').length).to.eql(markers.length);
            expect(root.getAttribute('title')).to.eql(newContext ? D.link.openHint : null);
            const hint = description(root);
            expect(hint?.textContent).to.eql(newContext ? D.link.openHint : undefined);
            if (hint) {
              expect(hint.hidden).to.eql(true);
              expect(root.contains(hint)).to.eql(false);
              expect(hint.tagName).to.eql('SPAN');
            }
            expect(root.hasAttribute('aria-label')).to.eql(false);
            expect(root.hasAttribute('role')).to.eql(false);
            expect(root.rel).to.eql(newContext ? 'noopener noreferrer' : '');
          } finally {
            act(() => res.dispose());
          }
        });
      }
    }
  }

  it('opening direction agrees with the requested context and native focus styling stays shared', async () => {
    for (const [openIn, Arrow] of [['self', LuArrowRight], ['new-tab', LuArrowUpRight]] as const) {
      const res = await TestReact.render(
        <>
          <A href={href}>Plain</A>
          <Link href={href} openIn={openIn}>Semantic</Link>
        </>,
      );
      try {
        const [plain, semantic] = res.container.querySelectorAll('a');
        expect(semantic.className).to.eql(plain.className);
        const markup = semantic.querySelector('svg')?.outerHTML;
        expect(markup).to.eql(renderToStaticMarkup(<Arrow size={D.iconSize} />));
      } finally {
        act(() => res.dispose());
      }
    }
  });

  it('missing and empty destinations → original rich children only, even when disabled', async () => {
    for (const destination of [undefined, '']) {
      for (const enabled of [true, false]) {
        const res = await TestReact.render(
          <Link href={destination} enabled={enabled} resource='web' openIn='new-tab'>
            <em>Label</em>
          </Link>,
        );
        try {
          expect(res.container.innerHTML).to.eql('<em>Label</em>');
        } finally {
          act(() => res.dispose());
        }
      }
    }
  });

  it('explicit self overrides document base target; caller modifier events stay native', async () => {
    const base = document.createElement('base');
    base.target = '_blank';
    document.head.appendChild(base);
    let clicks = 0;
    const res = await TestReact.render(
      <Link
        href={href}
        onClick={(e) => {
          expect(e.ctrlKey).to.eql(true);
          clicks++;
          e.preventDefault();
        }}
      >
        Label
      </Link>,
    );
    try {
      const root = anchor(res.container);
      expect(root.target).to.eql('_self');
      const click = DomMock.Mouse.event('click', {
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      act(() => root.querySelector('[aria-hidden="true"]')!.dispatchEvent(click));
      expect(clicks).to.eql(1);
      expect(click.defaultPrevented).to.eql(true);
      const key = DomMock.Keyboard.event('keydown', 'Enter', { bubbles: true, cancelable: true });
      act(() => root.dispatchEvent(key));
      expect(key.defaultPrevented).to.eql(false);
      expect(clicks).to.eql(1);
    } finally {
      act(() => res.dispose());
      base.remove();
    }
  });

  it('wider objects cannot inject competing target, download, availability, or icon authority', async () => {
    let unexpectedIcons = 0;
    const wider = {
      href,
      children: 'Label',
      target: 'competing-frame',
      download: 'unexpected.txt',
      'aria-disabled': true,
      rel: 'nofollow',
      icons: {
        leading() {
          unexpectedIcons++;
          return <span>Unexpected</span>;
        },
      },
    };
    const res = await TestReact.render(<Link {...wider} />);
    try {
      const root = anchor(res.container);
      expect(root.target).to.eql('_self');
      expect(root.hasAttribute('download')).to.eql(false);
      expect(root.hasAttribute('aria-disabled')).to.eql(false);
      expect(root.rel).to.eql('nofollow');
      expect(root.textContent).to.eql('Label');
      expect(root.querySelectorAll('[aria-hidden="true"]').length).to.eql(1);
      expect(unexpectedIcons).to.eql(0);
    } finally {
      act(() => res.dispose());
    }
  });

  it('default, blank, and localized hints → one description; explicit titles retain ownership', async () => {
    for (const openHint of [undefined, '', ' \t ', '  Ouvre un nouvel onglet ou une fenêtre  ']) {
      for (const title of [undefined, '', 'Caller help']) {
        const res = await TestReact.render(
          <Link
            href={href}
            openIn='new-tab'
            openHint={openHint}
            title={title}
            aria-describedby='help other help'
          >
            <strong>Specification</strong>
          </Link>,
        );
        try {
          const root = anchor(res.container);
          const ids = root.getAttribute('aria-describedby')!.split(' ');
          const hint = root.ownerDocument.getElementById(ids[ids.length - 1])!;
          const expected = Is.blank(openHint) ? D.link.openHint : openHint;
          expect(ids.slice(0, -1)).to.eql(['help', 'other']);
          expect(hint.textContent).to.eql(expected);
          expect(root.getAttribute('title')).to.eql(title ?? expected);
          expect(root.textContent).to.eql('Specification');
          expect(res.container.querySelectorAll('[hidden]').length).to.eql(1);
        } finally {
          act(() => res.dispose());
        }
      }
    }
  });

  it('availability transitions retain caller descriptions and stable per-instance hint IDs', async () => {
    let update: (next: Partial<Props>) => void = () => {
      throw new Error('Not mounted.');
    };
    function Example() {
      const [props, setProps] = useState<Partial<Props>>({
        href,
        openIn: 'new-tab',
        'aria-describedby': 'caller',
      });
      update = (next) => setProps((previous) => ({ ...previous, ...next }));
      return <Link {...props} resource='web'>Label</Link>;
    }
    const res = await TestReact.render(<Example />);
    try {
      const initial = description(anchor(res.container))!.id;
      act(() => update({ 'aria-describedby': `caller ${initial} ${initial}` }));
      expect(anchor(res.container).getAttribute('aria-describedby')).to.eql(`caller ${initial}`);
      act(() => update({ 'aria-describedby': 'caller' }));
      for (const change of [{ enabled: false }, { enabled: true, openIn: 'self' }] as const) {
        act(() => update(change));
        const root = anchor(res.container);
        expect(root.getAttribute('aria-describedby')).to.eql('caller');
        expect(root.hasAttribute('title')).to.eql(false);
        expect(res.container.querySelectorAll('[hidden]').length).to.eql(0);
      }
      act(() => update({ enabled: true, openIn: 'new-tab' }));
      expect(description(anchor(res.container))?.id).to.eql(initial);
      act(() => update({ href: '' }));
      expect(res.container.innerHTML).to.eql('Label');
      act(() => update({ href }));
      expect(description(anchor(res.container))?.id).to.eql(initial);
    } finally {
      act(() => res.dispose());
    }
  });

  it('disabled native branch suppresses handlers while retaining resource identity and caller title', async () => {
    let calls = 0;
    const res = await TestReact.render(
      <Link
        href={href}
        enabled={false}
        resource='web'
        openIn='new-tab'
        title='Caller help'
        onClick={() => calls++}
        onKeyDown={() => calls++}
      >
        Label
      </Link>,
    );
    try {
      const root = anchor(res.container);
      const click = DomMock.Mouse.click(root);
      const key = DomMock.Keyboard.event('keydown', 'Enter', { bubbles: true, cancelable: true });
      act(() => root.dispatchEvent(key));
      expect(click.event.defaultPrevented).to.eql(true);
      expect(key.defaultPrevented).to.eql(true);
      expect(calls).to.eql(0);
      expect(root.getAttribute('title')).to.eql('Caller help');
      expect(root.querySelectorAll('[aria-hidden="true"]').length).to.eql(1);
      expect(description(root)).to.eql(undefined);
    } finally {
      act(() => res.dispose());
    }
  });

  it('original caller styles and explicit focus clears survive semantic translation', async () => {
    for (const theme of ['Light', 'Dark'] as const) {
      for (const focus of [undefined, { outline: '3px dotted red' }]) {
        const res = await TestReact.render(
          <Link
            href={href}
            resource='web'
            theme={theme}
            style={[
              { minWidth: 120 },
              [false, { Padding: 4, minWidth: undefined, ':focus-visible': focus }],
            ]}
          >
            Label
          </Link>,
        );
        try {
          const root = anchor(res.container);
          const rules = Style.Dom.stylesheet().rules.items;
          const selector = `.${root.className}`;
          const base = rules.find((item) => item.selector === selector)?.style;
          const focusRule = rules.find((item) => item.selector === `${selector}:focus-visible`);
          const underline = Color.alpha(Color.theme(theme).fg, theme === 'Dark' ? 0.35 : 0.25);
          expect(base).to.include({ paddingTop: 4, paddingBottom: 4 });
          expect(base).not.to.have.property('minWidth');
          expect(base).not.to.have.property('--sys-focus-animation');
          expect(focusRule?.style).to.eql(focus);
          expect(base?.textDecoration).to.include(underline);
        } finally {
          act(() => res.dispose());
        }
      }
    }
  });

  it('SSR paragraph → phrasing-safe markup and distinct description associations per instance', () => {
    const markup = renderToStaticMarkup(
      <p>
        Before{' '}
        <Link href={href} resource='web' openIn='new-tab'>
          A <em>rich</em> label
        </Link>{' '}
        and <Link href={href} openIn='new-tab'>Another</Link> after.
      </p>,
    );
    const fragment = Html.parseFragment(markup);
    expect(fragment.childNodes.length).to.eql(1);
    const paragraph = fragment.childNodes[0];
    if (!Html.Is.element(paragraph)) throw new Error('Expected paragraph.');
    expect(paragraph.tagName).to.eql('p');
    const elements = paragraph.childNodes.filter(Html.Is.element);
    expect(elements.map((el) => el.tagName)).to.eql(['a', 'span', 'a', 'span']);
    const refs = elements
      .filter((el) => el.tagName === 'a')
      .map((el) => el.attrs.find((attr) => attr.name === 'aria-describedby')?.value);
    const ids = elements
      .filter((el) => el.tagName === 'span')
      .map((el) => el.attrs.find((attr) => attr.name === 'id')?.value);
    expect(refs).to.eql(ids);
    expect(ids[0]).not.to.eql(ids[1]);
    expect(ids.every((id) => Is.string(id) && id.length > 0)).to.eql(true);
    expect(markup).not.to.contain('<div');
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

function description(root: HTMLAnchorElement) {
  const ids = root.getAttribute('aria-describedby')?.split(' ') ?? [];
  return ids.map((id) => root.ownerDocument.getElementById(id)).find((el) => el?.hidden);
}
