import { describe, expect, it } from '../../-test.ts';
import { CellHelp } from '../../m.help/mod.ts';
import { stripAnsi } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import { Tmpl } from '../u/u.tmpl.ts';

describe('FmtHelp', () => {
  it('uses conceptual @sys/cell command titles', async () => {
    expect(stripAnsi(await FmtHelp.output())).to.contain('@sys/cell');
    expect(stripAnsi(await FmtHelp.initOutput())).to.contain('@sys/cell init');
    expect(stripAnsi(await FmtHelp.migrateOutput())).to.contain('@sys/cell migrate');
    expect(stripAnsi(await FmtHelp.taskOutput())).to.contain('@sys/cell task');
    expect(stripAnsi(await FmtHelp.killOutput())).to.contain('@sys/cell kill');
    expect(stripAnsi(await FmtHelp.dslOutput())).to.contain('@sys/cell dsl');
  });

  it('init --help --agent → renders command-specific agent sections', async () => {
    const text = stripAnsi(await FmtHelp.initOutput({ agent: true }));
    const guidance = await CellHelp.Init.load();
    const agent = sectionItems(between(text, 'Agent', 'Writes'), 'Agent');
    const writes = sectionItems(between(text, 'Writes', 'Owns'), 'Writes');
    const owns = sectionItems(between(text, 'Owns', 'Descriptor'), 'Owns');
    const descriptorTail = after(text, 'Descriptor');

    expect(agent).to.eql([...guidance.agent]);
    expect(writes).to.eql([...Tmpl.minimalWritePaths()]);
    expect(owns).to.eql([...Tmpl.minimalOwnedPaths()]);
    expect(writes).to.contain('.gitignore');
    expect(owns).to.not.contain('.gitignore');
    expect(descriptorTail).to.not.contain('```yaml');
  });

  it('dsl → renders root chapter chrome and chapter index', async () => {
    const text = stripAnsi(await FmtHelp.dslOutput());
    const guidance = await CellHelp.Dsl.load();

    expect(text).to.contain('@sys/cell dsl');
    expect(text).to.contain('Usage');
    expect(text).to.contain('Options');
    expect(text).to.contain('Formats');
    expectSectionLabels(text, guidance.sections.map(({ label }) => label));
    expectChapterIndex(text, guidance.chapters, 'human');
  });

  it('dsl --format skill → renders root chapter as a skill projection', async () => {
    const text = await FmtHelp.dslOutput({ format: 'skill' });
    const guidance = await CellHelp.Dsl.load();
    const meta = frontmatter(text);

    expect(text).to.eql(stripAnsi(text));
    expect(meta.name).to.eql('sys-cell-dsl');
    expect(meta.description).to.contain('use when');
    expect(text).to.contain(`# ${guidance.title}`);
    expectMarkdownSectionLabels(text, guidance.sections);
    expect(text).to.contain('## Chapters');
    expectChapterIndex(text, guidance.chapters, 'skill');
    expect(text).to.not.contain('Chapter   deno run -ER');
  });

  it('dsl child --format skill → renders deterministic child skill metadata', async () => {
    const path = ['pulled-view'] as const;
    const text = await FmtHelp.dslOutput({ path, format: 'skill' });
    const guidance = await CellHelp.Dsl.load(path);
    const meta = frontmatter(text);

    expect(text).to.eql(stripAnsi(text));
    expect(meta.name).to.eql('sys-cell-dsl-pulled-view');
    expect(meta.description).to.contain('use when');
    expect(text).to.contain(`# ${guidance.title}`);
    expectMarkdownSectionLabels(text, guidance.sections);
    expect(text).to.not.contain('## Chapters');
    expect(text).to.not.contain('@sys/cell dsl pulled-view');
  });

  it('dsl --format skill → emits canonical skill metadata for every chapter', async () => {
    const root = await CellHelp.Dsl.load();
    const chapters = [
      root,
      ...await Promise.all(root.chapters.map((item) => CellHelp.Dsl.load(item.path))),
    ];

    for (const chapter of chapters) {
      const text = await FmtHelp.dslOutput({ path: chapter.path, format: 'skill' });
      const meta = frontmatter(text);
      const expectedName = ['sys-cell-dsl', ...chapter.path].join('-');

      expect(meta.name).to.eql(expectedName);
      expect(/^[a-z0-9-]+$/.test(meta.name ?? '')).to.eql(true);
      expect(meta.description).to.contain('use when');
    }
  });

  it('dsl <chapter> → renders requested child chapter pages', async () => {
    const root = await CellHelp.Dsl.load();

    for (const link of root.chapters) {
      const chapter = await CellHelp.Dsl.load(link.path);
      const text = stripAnsi(await FmtHelp.dslOutput({ path: link.path }));

      expectDslChapterPage(text, chapter);
    }
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
  readonly title: string;
  readonly sections: readonly Section[];
};

type ChapterIndexFormat = 'human' | 'skill';

function expectDslChapterPage(text: string, chapter: Chapter) {
  expect(text).to.contain(['@sys/cell dsl', ...chapter.path].join(' '));
  expectSectionLabels(text, chapter.sections.map(({ label }) => label));
  expect(text).to.not.contain(chapterCommand(chapter, 'human'));
}

function expectMarkdownSectionLabels(text: string, sections: readonly Section[]) {
  sections.forEach((section) => expect(text).to.contain(`## ${section.label}`));
}

function expectChapterIndex(
  text: string,
  chapters: readonly ChapterLink[],
  format: ChapterIndexFormat,
) {
  chapters.forEach((chapter) => expect(text).to.contain(chapterCommand(chapter, format)));
}

function chapterCommand(chapter: ChapterLink | Chapter, format: ChapterIndexFormat): string {
  const base = ['deno run -ER jsr:@sys/cell dsl', ...chapter.path].join(' ');
  return format === 'skill' ? `${base} --format skill` : base;
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

function expectSectionLabels(text: string, labels: readonly string[]) {
  const lines = text.split('\n');
  let previous = -1;

  labels.forEach((label) => {
    const index = lines.findIndex((line, lineIndex) => {
      return lineIndex > previous && line.startsWith(label);
    });
    expect(index).to.be.greaterThan(previous);
    previous = index;
  });
}

function sectionItems(text: string, label: string) {
  return text
    .split('\n')
    .map((line) => line.startsWith(label) ? line.slice(label.length).trim() : line.trim())
    .filter((line) => line.length > 0);
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
