import { Admonition } from '@sys/ui-components/react/admonition';
import tinycolor from 'tinycolor2';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { D as Chip } from '../../Chip/common.ts';
import { Prose } from '../../Prose/mod.ts';
import { Color, Style } from '../common.ts';

const { UI } = Admonition;

describe('Admonition.UI', () => {
  DomMock.init({ beforeAll, afterAll });

  it('renders a complete untitled tip with an optional caller ID and decorative icon', async () => {
    const markdown = 'Try a **sample passkey**.';
    using res = await TestReact.render(
      <>
        <UI markdown={markdown} />
        <UI markdown={markdown} kind='tip' id='registration-guidance' />
      </>,
    );
    const [implicit, explicit] = res.container.querySelectorAll('[role="note"]');
    expect(implicit.hasAttribute('id')).to.eql(false);
    expect(explicit.id).to.eql('registration-guidance');
    expect(implicit.innerHTML).to.eql(explicit.innerHTML);
    expect(explicit.querySelector('[aria-hidden="true"] svg')).not.to.eql(null);
    expect(explicit.querySelectorAll('p')).to.have.length(1);
    expect(explicit.querySelector('p > strong')?.textContent).to.eql('sample passkey');
    expect(explicit.querySelector('[role="alert"], [aria-live]')).to.eql(null);
    expect(explicit.hasAttribute('aria-live')).to.eql(false);
  });

  it('renders the opening title as a bold lead and a secondary label without page headings', async () => {
    const markdown =
      '\n# Use a sample passkey\n\nRead the **guidance**.\n\n## After restart\n\n- Start over.';
    using res = await TestReact.render(<UI markdown={markdown} />);
    const note = res.container.querySelector('[role="note"]')!;
    const [lead, body, label] = note.querySelectorAll('p');
    expect(lead.querySelector('strong')?.textContent).to.eql('Use a sample passkey');
    expect(body.querySelector('strong')?.textContent).to.eql('guidance');
    expect(lead.className).not.to.eql(body.className);
    expect(label.textContent).to.eql('After restart');
    const style = label.ownerDocument.defaultView!.getComputedStyle(label);
    expect(style.textTransform).to.eql('uppercase');
    expect(style.letterSpacing).to.eql('0.51px'); // 0.05em at the default 10.2px label size.
    expect(note.querySelector('h1, h2')).to.eql(null);
    expect(note.querySelector('ul li')?.textContent).to.eql('Start over.');
  });

  it('gives the secondary label less contrast than body text on both default panels', async () => {
    // Compare the composited colors on the same panel, not the foreground alphas.
    const over = (foreground: string, background: string) => {
      const ink = tinycolor(foreground);
      expect(ink.isValid(), foreground).to.eql(true);
      return tinycolor.mix(background, ink, ink.getAlpha() * 100).toHexString();
    };
    const markdown = 'Read this.\n\n## After restart';
    for (const theme of ['Light', 'Dark'] as const) {
      using res = await TestReact.render(<UI theme={theme} markdown={markdown} />);
      const view = res.container.ownerDocument.defaultView!;
      const note = res.container.querySelector('[role="note"]')!;
      const [body, label] = note.querySelectorAll('p');
      const panel = over(view.getComputedStyle(note).backgroundColor, Color.theme(theme).bg);
      const contrast = (el: Element) =>
        tinycolor.readability(over(view.getComputedStyle(el).color, panel), panel);
      expect(contrast(label), theme).to.be.below(contrast(body));
    }
  });

  it('keeps bold in its own note’s title color without recoloring adjacent Markdown', async () => {
    const markdown = '# Lead\n\n- Read **this**.';
    for (const first of ['Light', 'Dark'] as const) {
      const themes = [first, Color.Theme.invert(first)];
      using res = await TestReact.render(
        <>
          {themes.map((theme) => <UI key={theme} theme={theme} markdown={markdown} />)}
          <Prose.Markdown.UI value={markdown} style={{ color: 'teal' }} />
        </>,
      );
      const view = res.container.ownerDocument.defaultView!;
      const color = (el: Element) => view.getComputedStyle(el).color;
      const notes = [...res.container.querySelectorAll('[role="note"]')];
      for (const [i, theme] of themes.entries()) {
        const note = notes[i];
        const title = color(note.querySelector('p')!);
        expect(Color.toHex(title)).to.eql(Color.theme(theme).fg);
        const item = note.querySelector('li')!;
        expect(color(item.querySelector('strong')!)).to.eql(title);
        if (theme === 'Dark') expect(color(item)).not.to.eql(title);
      }
      const prose = res.container.lastElementChild!;
      expect(color(prose.querySelector('strong')!)).to.eql(color(prose));
    }
  });

  it('anchors the glyph to one line whether the note starts with a title or a paragraph', async () => {
    const titled = '# Lorem\n\nIpsum.';
    using res = await TestReact.render(
      <>
        <UI markdown={titled} theme='Dark' />
        <UI markdown='Lorem ipsum.' theme='Light' />
      </>,
    );
    const view = res.container.ownerDocument.defaultView!;
    for (const note of res.container.querySelectorAll('[role="note"]')) {
      expect(view.getComputedStyle(note).alignItems).to.eql('start');
      const marker = note.firstElementChild!;
      expect(view.getComputedStyle(marker).alignItems).to.eql('center');
      // The mock does not lay out line-height units; check the rule emitted to the stylesheet.
      const selector = `.${marker.className}`;
      const rule = Style.Dom.stylesheet().rules.items.find((r) => r.selector === selector);
      expect(rule?.rule).to.include('height: 1lh;');
    }
  });

  it('renders a distinct decorative glyph for each kind without announcing urgency', async () => {
    const kinds = ['tip', 'note', 'important', 'caution', 'warning'] as const;
    using res = await TestReact.render(
      <>{kinds.map((kind) => <UI key={kind} kind={kind} markdown='Lorem ipsum.' />)}</>,
    );
    const notes = [...res.container.querySelectorAll('[role="note"]')];
    expect(notes).to.have.length(kinds.length);
    const glyphs = notes.map((el) => el.querySelector('[aria-hidden="true"] svg')!.innerHTML);
    expect(new Set(glyphs).size).to.eql(kinds.length);
    expect(res.container.querySelector('[role="alert"], [aria-live]')).to.eql(null);
  });

  it('controls text selection per note without disabling its links', async () => {
    const markdown = 'Read the [guide](#guide).';
    using res = await TestReact.render(
      <>
        <UI markdown={markdown} />
        <UI markdown={markdown} selectable={false} />
        <UI markdown={markdown} selectable />
      </>,
    );
    const view = res.container.ownerDocument.defaultView!;
    const notes = [...res.container.querySelectorAll('[role="note"]')];
    const selection = notes.map((note) => {
      expect(note.querySelector('a')?.getAttribute('href')).to.eql('#guide');
      return view.getComputedStyle(note.querySelector('p')!.parentElement!).userSelect;
    });
    expect(selection).to.eql(['text', 'none', 'text']);
  });

  it('can skip both new-tab and same-context links without disabling navigation', async () => {
    const markdown = 'Read the [guide](https://example.com/guide) or [jump](#details).';
    using res = await TestReact.render(
      <>
        <UI markdown={markdown} />
        <UI markdown={markdown} linksTabbable={false} />
      </>,
    );
    const [native, skipped] = res.container.querySelectorAll('[role="note"]');
    const links = (note: Element) => [...note.querySelectorAll('a')];
    expect(links(native).map((link) => link.getAttribute('tabindex'))).to.eql([null, null]);
    expect(links(skipped).map((link) => link.getAttribute('tabindex'))).to.eql(['-1', '-1']);
    expect(links(skipped).map((link) => link.getAttribute('href'))).to.eql([
      'https://example.com/guide',
      '#details',
    ]);
    expect(links(skipped).map((link) => link.getAttribute('target'))).to.eql(['_blank', null]);
  });

  it('defaults to 4px corners and honors square corners and caller style overrides', async () => {
    using res = await TestReact.render(
      <>
        <UI markdown='' />
        <UI markdown='' radius={0} />
        <UI markdown='' radius={8} />
        <UI markdown='' radius={8} style={{ borderRadius: 12 }} />
      </>,
    );
    const notes = [...res.container.querySelectorAll('[role="note"]')];
    const view = res.container.ownerDocument.defaultView!;
    const corners = notes.map((el) => view.getComputedStyle(el).borderTopLeftRadius);
    expect(corners).to.eql(['4px', '0px', '8px', '12px']);
  });

  it('tightens only the outer bullet gutter, leaving shared prose and task lists alone', async () => {
    const markdown = '- Lorem ipsum.\n  - Dolor sit amet.';
    using res = await TestReact.render(
      <>
        <UI markdown={markdown} />
        <UI markdown='- [ ] Lorem ipsum.' />
        <Prose.Markdown.UI value={markdown} />
      </>,
    );
    const lists = [...res.container.querySelectorAll('ul')];
    const view = res.container.ownerDocument.defaultView!;
    const [outer, nested, tasks, prose, proseNested] = lists.map((el) =>
      view.getComputedStyle(el).paddingLeft
    );
    expect(outer).not.to.eql(prose);
    expect(nested).to.eql(proseNested);
    expect(tasks).to.eql(prose);
  });

  it('does not treat a later level-one heading as the opening title', async () => {
    const markdown = 'Intro.\n\n# Later heading';
    using res = await TestReact.render(<UI markdown={markdown} />);
    expect(res.container.querySelector('p')?.textContent).to.eql('Intro.');
    expect(res.container.querySelector('h1')?.textContent).to.eql('Later heading');
  });

  it('reuses code chips and gives only safe absolute web links new-tab cues', async () => {
    const markdown = [
      '`sys.ui:accounts`',
      '[Docs](HTTPS://example.com/guide?edition=2#links "Authored title")',
      '[Web](http://example.com/archive)',
      '[Mail](mailto:help@example.com)',
      '[Call](tel:+15551234)',
      '[Local](./help)',
      '[Jump](#details)',
      '[Untrusted](javascript:alert%281%29)',
      '[Protocol relative](//example.com)',
    ].join(' · ');
    using res = await TestReact.render(<UI markdown={markdown} />);
    const { container } = res;
    expect(container.querySelector(`[data-component="${Chip.displayName}"]`)?.textContent)
      .to.eql('sys.ui:accounts');
    const [docs, web, ...sameContext] = container.querySelectorAll('a');
    expect(docs.getAttribute('href')).to.eql('HTTPS://example.com/guide?edition=2#links');
    expect(web.getAttribute('href')).to.eql('http://example.com/archive');
    expect(docs.getAttribute('title')).to.eql('Authored title');
    for (const link of [docs, web]) {
      expect(link.getAttribute('target')).to.eql('_blank');
      expect(link.rel).to.eql('noopener noreferrer');
      expect(link.querySelector('[aria-hidden="true"] svg')).not.to.eql(null);
      const hint = document.getElementById(link.getAttribute('aria-describedby')!);
      expect(hint?.hidden).to.eql(true);
      expect(hint?.textContent).to.eql('Opens in a new tab');
    }
    expect(sameContext.map((link) => link.getAttribute('href'))).to.eql([
      'mailto:help@example.com',
      'tel:+15551234',
      './help',
      '#details',
    ]);
    for (const link of sameContext) {
      expect(link.getAttribute('target')).to.eql(null);
      expect(link.hasAttribute('aria-describedby')).to.eql(false);
      expect(link.querySelector('svg')).to.eql(null);
    }
    expect(container.textContent).to.include('Untrusted · Protocol relative');
  });
});
