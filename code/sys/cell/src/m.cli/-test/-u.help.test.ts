import { describe, expect, it } from '../../-test.ts';
import { CellHelp } from '../../m.help/mod.ts';
import { Str, stripAnsi } from '../common.ts';
import { FmtHelp } from '../u.help/mod.ts';
import { Tmpl } from '../u/tmpl.ts';

describe('FmtHelp', () => {
  it('uses conceptual @sys/cell command titles', async () => {
    expect(stripAnsi(await FmtHelp.output())).to.contain('@sys/cell');
    expect(stripAnsi(await FmtHelp.initOutput())).to.contain('@sys/cell init');
    expect(stripAnsi(await FmtHelp.migrateOutput())).to.contain('@sys/cell migrate');
    expect(stripAnsi(await FmtHelp.taskOutput())).to.contain('@sys/cell task');
    expect(stripAnsi(await FmtHelp.dslOutput())).to.contain('@sys/cell dsl');
  });

  it('init --help --agent → renders command-specific agent facts', async () => {
    const text = stripAnsi(await FmtHelp.initOutput({ agent: true }));
    const guidance = await CellHelp.Init.load();
    const agent = sectionItems(between(text, 'Agent', 'Writes'), 'Agent');
    const writes = sectionItems(between(text, 'Writes', 'Owns'), 'Writes');
    const owns = sectionItems(between(text, 'Owns', 'Descriptor'), 'Owns');

    expect(agent).to.eql([...guidance.agent]);
    expect(writes).to.eql([...Tmpl.minimalWritePaths()]);
    expect(owns).to.eql([...Tmpl.minimalOwnedPaths()]);
    expect(writes).to.contain('.gitignore');
    expect(owns).to.not.contain('.gitignore');

    const descriptor = await Tmpl.minimalDescriptor();
    const descriptorTail = after(text, 'Descriptor');

    expect(text).to.contain('Descriptor   kind: cell');
    expect(text).to.not.contain('Descriptor\n  kind: cell');
    expect(text).to.not.contain('Descriptor   ```yaml');
    expect(descriptorTail).to.not.contain('```yaml');
    descriptorLines(descriptor).forEach((line) => {
      expect(text).to.contain(line);
    });
  });

  it('dsl → renders the root chapter with child chapter index', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput());
    const guidance = await CellHelp.Dsl.load();

    expect(text).to.contain('@sys/cell dsl');
    expect(text).to.contain(guidance.summary);
    expect(text).to.contain('Usage');
    expect(text).to.contain('deno run -ER jsr:@sys/cell dsl [chapter...] [--format <format>]');
    expect(text).to.contain('Options');
    expect(text).to.contain('--format <format>');
    expect(text).to.contain('Formats');
    expectRenderedSections(text, guidance.sections, { end: 'Chapter' });
    expectChapterIndex(text, guidance.chapters, 'human');
  });

  it('dsl --format skill → renders the root DSL chapter as a skill projection', async () => {
    const text = await FmtHelp.dslOutput({ format: 'skill' });
    const guidance = await CellHelp.Dsl.load();
    const meta = frontmatter(text);

    expect(text).to.eql(stripAnsi(text));
    expect(meta.name).to.eql('sys-cell-dsl');
    expect(meta.description).to.contain('reading protocol');
    expect(meta.description).to.contain('use when');
    expect(text).to.contain(`# ${guidance.title}`);
    expect(text).to.contain(guidance.summary);
    expectMarkdownSections(text, guidance.sections);
    expect(text).to.contain('## Chapters');
    expectChapterIndex(text, guidance.chapters, 'skill');
    expect(text).to.not.contain('Chapter   deno run -ER');
  });

  it('dsl pulled-view --format skill → renders deterministic child skill metadata', async () => {
    const path = ['pulled-view'] as const;
    const text = await FmtHelp.dslOutput({ path, format: 'skill' });
    const guidance = await CellHelp.Dsl.load(path);
    const meta = frontmatter(text);

    expect(text).to.eql(stripAnsi(text));
    expect(meta.name).to.eql('sys-cell-dsl-pulled-view');
    expect(meta.description).to.contain('use when');
    expect(text).to.contain(`# ${guidance.title}`);
    expect(text).to.contain(guidance.summary);
    expectMarkdownSections(text, guidance.sections);
    expect(text).to.not.contain('## Chapters');
    expect(text).to.not.contain('@sys/cell dsl pulled-view');
  });

  it('dsl --format skill → emits canonical skill metadata for every current chapter', async () => {
    const cases = [
      { path: [], name: 'sys-cell-dsl' },
      { path: ['pulled-view'], name: 'sys-cell-dsl-pulled-view' },
      { path: ['static-serve-service'], name: 'sys-cell-dsl-static-serve-service' },
      { path: ['service'], name: 'sys-cell-dsl-service' },
      { path: ['proxy-service'], name: 'sys-cell-dsl-proxy-service' },
      { path: ['start-services'], name: 'sys-cell-dsl-start-services' },
      { path: ['examples'], name: 'sys-cell-dsl-examples' },
    ] as const;

    for (const item of cases) {
      const text = await FmtHelp.dslOutput({ path: item.path, format: 'skill' });
      const meta = frontmatter(text);

      expect(meta.name).to.eql(item.name);
      expect(/^[a-z0-9-]+$/.test(meta.name ?? '')).to.eql(true);
      expect(meta.description).to.contain('use when');
    }
  });

  it('dsl pulled-view → faithfully renders the requested chapter', async () => {
    const path = ['pulled-view'] as const;
    const text = stripAnsi(await FmtHelp.dslOutput({ path }));
    const guidance = await CellHelp.Dsl.load(path);

    expectDslChapterPage(text, guidance);
    expect(text).to.not.contain('https://example.com/foo/dist.json');
  });

  it('dsl static-serve-service → faithfully renders the requested chapter', async () => {
    const path = ['static-serve-service'] as const;
    const text = stripAnsi(await FmtHelp.dslOutput({ path }));
    const guidance = await CellHelp.Dsl.load(path);

    expectDslChapterPage(text, guidance);
    expect(text).to.not.contain('kind: http-static');
    expect(text).to.not.contain('views: [<view>]');
    expect(text).to.not.contain('./-config/@sys.http/static/web.yaml');
    expect(text).to.not.contain('./view/web');
    expect(text).to.contain("from: 'jsr:@sys/tools/serve'");
    expect(text).to.contain('use: Serve');
  });

  it('dsl service → faithfully renders the requested chapter', async () => {
    const path = ['service'] as const;
    const text = stripAnsi(await FmtHelp.dslOutput({ path }));
    const guidance = await CellHelp.Dsl.load(path);

    expectDslChapterPage(text, guidance);
    expect(text).to.not.contain('kind: <kind>');
    expect(text).to.not.contain('views: [<view>]');
    expect(text).to.not.contain('Stripe');
    expect(text).to.not.contain('stripe');
    expect(text).to.not.contain('driver.stripe');
    expect(text).to.not.contain('127.0.0.1');
    expect(text).to.contain('complete endpoint binding');
    expect(text).to.contain('variants.dev');
    expect(text).to.contain("from: 'jsr:@sys/driver-vite/service'");
    expect(text).to.contain('config: ./-config/@sys.driver-vite/view.dev.yaml');
    expect(text).to.contain('Mode is not forwarded');
  });

  it('dsl start-services → faithfully renders the requested chapter', async () => {
    const path = ['start-services'] as const;
    const text = stripAnsi(await FmtHelp.dslOutput({ path }));
    const guidance = await CellHelp.Dsl.load(path);

    expectDslChapterPage(text, guidance);
    expect(text).to.not.contain('Stripe');
    expect(text).to.not.contain('stripe');
    expect(text).to.contain('read `dsl service` before adding');
    expect(text).to.contain('or changing variants');
    expect(text).to.contain('Cell chooses the complete binding');
  });

  it('dsl proxy-service → faithfully renders the requested chapter', async () => {
    const path = ['proxy-service'] as const;
    const text = stripAnsi(await FmtHelp.dslOutput({ path }));
    const guidance = await CellHelp.Dsl.load(path);

    expectDslChapterPage(text, guidance);
    expect(text).to.not.contain('kind: http-proxy');
    expect(text).to.not.contain('for.views');
    expect(text).to.not.contain('Stripe');
    expect(text).to.not.contain('stripe');
    expect(text).to.not.contain('/payments/');
    expect(text).to.not.contain('driver.stripe');
    expect(text).to.not.contain('example.com');
    expect(text).to.not.contain('http://127.0.0.1:4040/');
  });

  it('dsl examples → faithfully renders operational examples', async () => {
    const path = ['examples'] as const;
    const text = stripAnsi(await FmtHelp.dslOutput({ path }));
    const guidance = await CellHelp.Dsl.load(path);

    expectDslChapterPage(text, guidance);
    expect(text).to.contain('fs.db.team');
    expect(text).to.contain('jsr:@sys/driver-stripe/server/fixture');
    expect(text).to.contain('StripeFixture');
    expect(text).to.contain('services:');
    expect(text).to.contain('tasks:');
    expect(text).to.not.contain('runtime.services');
    expect(text).to.not.contain('export:');
  });
});

/**
 * Helpers:
 */
type Section = { readonly label: string; readonly items: readonly string[] };
type ChapterLink = {
  readonly id: string;
  readonly path: readonly string[];
  readonly summary: string;
};
type Chapter = {
  readonly path: readonly string[];
  readonly summary: string;
  readonly sections: readonly Section[];
};
type RenderedSectionsOptions = { readonly end?: string };

type ChapterIndexFormat = 'human' | 'skill';

function expectDslChapterPage(text: string, chapter: Chapter) {
  expect(text).to.contain(['@sys/cell dsl', ...chapter.path].join(' '));
  expect(text).to.contain(chapter.summary);
  expectRenderedSections(text, chapter.sections);
  expect(text).to.not.contain(chapterCommand(chapter, 'human'));
}

function expectMarkdownSections(text: string, sections: readonly Section[]) {
  sections.forEach((section) => {
    expect(text).to.contain(`## ${section.label}`);
    section.items.forEach((item) => expect(text).to.contain(item));
  });
}

function expectChapterIndex(
  text: string,
  chapters: readonly ChapterLink[],
  format: ChapterIndexFormat,
) {
  chapters.forEach((chapter) => {
    expect(text).to.contain(chapterCommand(chapter, format));
    expect(text).to.contain(chapter.summary);
  });
}

function renderedSections(
  text: string,
  sections: readonly { readonly label: string }[],
  options: RenderedSectionsOptions = {},
) {
  return sections.map((section, index, all) => {
    const end = all[index + 1]?.label ?? options.end;
    const block = sectionBlock(text, section.label, end);
    return {
      label: section.label,
      items: sectionItems(block, section.label),
    };
  });
}

function expectRenderedSections(
  text: string,
  expected: readonly Section[],
  options?: RenderedSectionsOptions,
) {
  const sections = renderedSections(text, expected, options);

  expect(sections.map((item) => item.label)).to.eql(expected.map((item) => item.label));
  expected.forEach((item) => {
    expect(section(sections, item.label)).to.eql(expectedItems(item));
  });
}

function chapterCommand(chapter: ChapterLink | Chapter, format: ChapterIndexFormat): string {
  const base = ['deno run -ER jsr:@sys/cell dsl', ...chapter.path].join(' ');
  return format === 'skill' ? `${base} --format skill` : base;
}

function descriptorLines(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text)
    .split('\n')
    .filter((line) => line.length > 0);
}

function frontmatter(text: string): Record<string, string> {
  expect(text.startsWith('---\n')).to.eql(true);
  const end = text.indexOf('\n---', 4);
  expect(end).to.be.greaterThan(-1);

  const result: Record<string, string> = {};
  text
    .slice(4, end)
    .split('\n')
    .forEach((line) => {
      const [key, value = ''] = line.split(/: /, 2);
      result[key] = value.replace(/^"|"$/g, '');
    });
  return result;
}

function sectionItems(text: string, label: string) {
  return text
    .split('\n')
    .map((line) => line.startsWith(label) ? line.slice(label.length).trim() : line.trim())
    .filter((line) => line.length > 0);
}

function expectedItems(section: Section): readonly string[] {
  return section.items.flatMap((item) =>
    Str.trimEdgeNewlines(item)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  );
}

function sectionBlock(text: string, start: string, end?: string) {
  const lines = text.split('\n');
  const startIndex = lines.findIndex((line) => line.startsWith(start));
  const endIndex = end
    ? lines.findIndex((line, index) => index > startIndex && line.startsWith(end))
    : lines.length;

  expect(startIndex).to.be.greaterThan(-1);
  if (end) expect(endIndex).to.be.greaterThan(startIndex);

  return lines.slice(startIndex, endIndex > -1 ? endIndex : lines.length).join('\n');
}

function section(sections: readonly { label: string; items: readonly string[] }[], label: string) {
  const found = sections.find((item) => item.label === label);
  expect(found).not.to.eql(undefined);
  return found?.items ?? [];
}

function between(text: string, start: string, end: string) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex);
  expect(startIndex).to.be.greaterThan(-1);
  expect(endIndex).to.be.greaterThan(startIndex);
  return text.slice(startIndex, endIndex);
}

function after(text: string, start: string) {
  const startIndex = text.indexOf(start);
  expect(startIndex).to.be.greaterThan(-1);
  return text.slice(startIndex);
}
