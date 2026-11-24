import { act, describe, expect, it, specimenFixture, TestReact } from '../../../-test.ts';
import { Debug, type DebugSignals } from '../-spec/-SPEC.Debug.tsx';
import { D as Chip } from '../../Chip/common.ts';
import { STORAGE_KEY } from '../common.ts';

const loadSpec = () => import('../-spec/-SPEC.tsx');

describe('Admonition: owner specimen', () => {
  it('loads sample content and cycles kind and radius independently', async () => {
    await using fixture = await specimenFixture<DebugSignals>(STORAGE_KEY.DEV, loadSpec);
    const { host, debug } = fixture;
    expect(fixture.observe().size).to.include({ mode: 'center', width: 360 });
    using panel = await TestReact.render(<Debug debug={debug} />);
    const buttons =
      () => [...panel.container.querySelectorAll<HTMLElement>('button, [role="button"]')];
    const pressed = () => buttons().filter((el) => el.getAttribute('aria-pressed') === 'true');
    const press = (label: string) => {
      const button = buttons().find((el) => el.textContent === label);
      if (!button) throw new Error(`Missing specimen control: ${label}`);
      expect(button.matches(':disabled, [aria-disabled="true"]'), label).to.eql(false);
      return act(async () => {
        button.click();
        await Promise.resolve(); // Flush the signal-driven redraw.
      });
    };

    const about = panel.container.querySelector('[role="note"]')!;
    expect(about.previousElementSibling?.textContent).to.eql('Admonition');
    expect(about.nextElementSibling?.textContent).to.include('theme:');
    expect(about.querySelector('a')?.getAttribute('href')).to.eql(
      'https://oreillymedia.github.io/production-resources/styleguide/#headings',
    );
    expect(pressed().map((el) => el.textContent)).to.eql(['Titled (Tip)']);
    {
      using preview = await TestReact.render(await host.subject());
      const lead = preview.container.querySelector('p > strong');
      expect(lead?.textContent).to.eql('Lorem ipsum');
      expect([...preview.container.querySelectorAll('a')].map((link) => link.hostname)).to.eql([
        'example.com',
        'example.com',
      ]);
    }

    await press('Plain (Note)');
    expect(pressed().map((el) => el.textContent)).to.eql(['Plain (Note)']);
    for (const label of ['Note', 'Tip', 'Important', 'Caution', 'Warning']) {
      await press(`kind: ${label}`);
    }
    expect(debug.props.kind.value).to.eql('note');
    await press('radius: 4px');
    expect(debug.props.radius.value).to.eql(8);
    expect(debug.props.sample.value).to.eql('plain');
    {
      using preview = await TestReact.render(await host.subject());
      const paragraphs = preview.container.querySelectorAll('p');
      expect(paragraphs).to.have.length(1);
      expect(paragraphs[0].querySelector(`[data-component="${Chip.displayName}"]`)?.textContent)
        .to.eql('ipsum');
      expect(paragraphs[0].querySelector('a')?.href).to.eql('https://example.com/#amet');
    }

    await press('Long (Note)');
    expect(debug.props.kind.value).to.eql('note');
    {
      using preview = await TestReact.render(await host.subject());
      const note = preview.container.querySelector('[role="note"]')!;
      const [lead, ...body] = [...note.querySelectorAll('p')].filter((p) => !p.closest('li'));
      expect(lead.querySelector('strong')?.textContent).to.eql('Nota bene, lector');
      expect(body).to.have.length(3);
      expect(note.querySelectorAll('ul > li')).to.have.length(2);
    }

    const additional = [
      { label: 'Checklist (Caution)', kind: 'caution', lead: 'Caution: nullam vitae' },
      { label: 'Consequence (Warning)', kind: 'warning', lead: 'Warning: littera scripta manet' },
    ] as const;
    for (const { label, kind, lead } of additional) {
      await press(label);
      expect(pressed().map((el) => el.textContent)).to.eql([label]);
      expect(debug.props.kind.value).to.eql(kind);
      using preview = await TestReact.render(await host.subject());
      expect(preview.container.querySelector('p > strong')?.textContent).to.eql(lead);
    }

    await press('Expanded (Important)');
    expect(pressed().map((el) => el.textContent)).to.eql(['Expanded (Important)']);
    using preview = await TestReact.render(await host.subject());
    expect(debug.props.kind.value).to.eql('important');
    expect(debug.props.radius.value).to.eql(8);
    expect(preview.container.textContent).to.include('Dolor sit amet');
    expect(preview.container.querySelectorAll('li')).to.have.length(2);
    expect(preview.container.querySelector(`[data-component="${Chip.displayName}"]`)?.textContent)
      .to.eql('perspiciatis');
    expect(preview.container.querySelector<HTMLAnchorElement>('li a')?.href).to.eql(
      'https://example.com/#dolor',
    );
  });
});
