import { stripAnsi } from '@sys/cli/fmt';
import { describe, expect, it } from '../../-test.ts';
import { TmplHelp } from '../../m.help/mod.ts';
import { entry } from '../-entry.ts';

type Chapter = Awaited<ReturnType<typeof TmplHelp.Dsl.load>>;

type RunResult = {
  readonly exitCode: number;
  readonly raw: string;
  readonly text: string;
};

const dslCommand = 'deno run -ERW jsr:@sys/tmpl dsl';
const templateChapters = ['repo', 'pkg', 'pkg.help', 'm.mod', 'm.mod.ui', 'm.mod.ui.controller'];

describe('m.tmpl/-entry dsl', () => {
  it('resources define root as the progressive scaffold router', async () => {
    const root = await TmplHelp.Dsl.load();

    expect(root.path).to.eql([]);
    expect(root.chapters.map((chapter) => chapter.id)).to.eql(templateChapters);
    expect(root.sections.map((section) => section.label)).to.eql([
      'Reading protocol',
      'Rule',
      'Decision protocol',
      'Speech acts',
      'Slots',
      'Command grammar',
      'Verification',
    ]);

    const protocol = root.sections[0];
    expect(protocol.items.some((item) => item.includes(`${dslCommand}`))).to.eql(true);
    expect(protocol.items.some((item) => item.includes('MUST NOT read every chapter'))).to.eql(
      true,
    );
    expect(protocol.items.some((item) => item.includes(`${dslCommand} <template>`))).to.eql(true);
  });

  it('dsl → renders root DSL help from resources without flooding child chapters', async () => {
    const root = await TmplHelp.Dsl.load();
    const repo = await TmplHelp.Dsl.load(['repo']);
    const res = await run(['dsl']);

    expect(res.exitCode).to.eql(0);
    expect(res.text).to.contain('@sys/tmpl dsl');
    expect(res.text).to.contain('Usage');
    expect(res.text).to.contain(`${dslCommand} [chapter...]`);
    expectChapterRendered(res.text, root);
    expect(res.text).to.contain('Chapter');
    expect(res.text.indexOf('Reading protocol')).to.be.lessThan(res.text.indexOf('Rule'));
    expect(res.text).to.not.contain(section(repo, 'Side effects').items[0]);
  });

  it('dsl repo → renders only the repo chapter from resources', async () => {
    const root = await TmplHelp.Dsl.load();
    const repo = await TmplHelp.Dsl.load(['repo']);
    const res = await run(['dsl', 'repo']);

    expect(res.exitCode).to.eql(0);
    expect(res.text).to.contain('@sys/tmpl dsl repo');
    expectChapterRendered(res.text, repo);
    expect(res.text).to.not.contain(`${dslCommand} pkg`);
    expect(res.text).to.not.contain(section(root, 'Reading protocol').items[0]);
  });

  it('dsl --format skill → renders the root skill with drill-down chapter commands', async () => {
    const root = await TmplHelp.Dsl.load();
    const res = await run(['dsl', '--format', 'skill']);

    expect(res.exitCode).to.eql(0);
    expect(res.raw).to.eql(res.text);
    expect(res.text).to.contain('---\nname: "sys-tmpl-dsl"');
    expect(res.text).to.contain('description: "Guides @sys/tmpl reading protocol');
    expectMarkdownChapterRendered(res.text, root);
    root.chapters.forEach((chapter) => {
      expect(res.text).to.contain(`\`${dslCommand} ${chapter.path.join(' ')} --format skill\``);
    });
  });

  it('dsl m.mod.ui --format skill → renders child skill Markdown from resources', async () => {
    const chapter = await TmplHelp.Dsl.load(['m.mod.ui']);
    const res = await run(['dsl', 'm.mod.ui', '--format', 'skill']);

    expect(res.exitCode).to.eql(0);
    expect(res.raw).to.eql(res.text);
    expect(res.text).to.contain('---\nname: "sys-tmpl-dsl-m-mod-ui"');
    expectMarkdownChapterRendered(res.text, chapter);
    expect(res.text).to.not.contain('@sys/tmpl dsl m.mod.ui');
  });

  it('dsl --format human → preserves human DSL help', async () => {
    const root = await TmplHelp.Dsl.load();
    const res = await run(['dsl', '--format=human']);

    expect(res.exitCode).to.eql(0);
    expect(res.text).to.contain('@sys/tmpl dsl');
    expectChapterRendered(res.text, root);
  });

  it('dsl --format unknown → fails clearly', async () => {
    const res = await run(['dsl', '--format', 'xml']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: Unsupported dsl format: xml (expected: human, skill)');
  });

  it('dsl --format without value → fails clearly', async () => {
    const res = await run(['dsl', '--format']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: Option requires a value: --format');
  });

  it('dsl repeated --format → fails clearly', async () => {
    const res = await run(['dsl', '--format', 'human', '--format', 'skill']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: Repeated option for dsl: --format');
  });

  it('dsl with scaffold flags → rejects the scaffold path', async () => {
    const res = await run(['dsl', '--dir', 'src/m.Foo']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: Unexpected flag for dsl: --dir');
  });

  it('dsl unknown → fails clearly', async () => {
    const res = await run(['dsl', 'missing']);

    expect(res.exitCode).to.eql(1);
    expect(res.text).to.contain('Failed: TmplHelp: DSL chapter not found: missing');
  });
});

function expectChapterRendered(text: string, chapter: Chapter) {
  summaryLines(chapter.summary).forEach((line) => expect(text).to.contain(line));

  chapter.sections.forEach((section) => {
    expect(text).to.contain(section.label);
    section.items.forEach((item) => expectRenderedItem(text, item));
  });

  chapter.chapters.forEach((chapter) => {
    expect(text).to.contain(`${dslCommand} ${chapter.path.join(' ')}`);
    summaryLines(chapter.summary).forEach((line) => expect(text).to.contain(line));
  });
}

function expectRenderedItem(text: string, item: string) {
  const lines = summaryLines(item);
  if (lines.length <= 1) {
    expect(normalizeWhitespace(text)).to.contain(normalizeWhitespace(lines[0] ?? ''));
    return;
  }
  lines.forEach((line) => expect(text).to.contain(line));
}

function expectMarkdownChapterRendered(text: string, chapter: Chapter) {
  expect(text).to.contain(`# ${chapter.title}`);
  summaryLines(chapter.summary).forEach((line) => expect(text).to.contain(line));

  chapter.sections.forEach((section) => {
    expect(text).to.contain(`## ${section.label}`);
    section.items.forEach((item) => expectRenderedItem(text, item));
  });
}

function section(chapter: Chapter, label: string) {
  const section = chapter.sections.find((section) => section.label === label);
  if (!section) throw new Error(`Missing section: ${label}`);
  return section;
}

function summaryLines(summary: string): readonly string[] {
  return summary.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
}

function normalizeWhitespace(input: string): string {
  return input.split(/\s+/).join(' ').trim();
}

async function run(argv: readonly string[]): Promise<RunResult> {
  const lines: string[] = [];
  const info = console.info;
  const warn = console.warn;
  const previousExitCode = Deno.exitCode;

  try {
    console.info = (...args: unknown[]) => lines.push(args.map(String).join(' '));
    console.warn = (...args: unknown[]) => lines.push(args.map(String).join(' '));
    Deno.exitCode = 0;

    await entry([...argv]);

    const raw = lines.join('\n');
    return { exitCode: Deno.exitCode, raw, text: stripAnsi(raw) };
  } finally {
    console.info = info;
    console.warn = warn;
    Deno.exitCode = previousExitCode;
  }
}
