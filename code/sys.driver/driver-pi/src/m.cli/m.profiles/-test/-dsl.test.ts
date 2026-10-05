import { describe, expect, it } from '../../../-test.ts';
import { PiHelp } from '../../../m.core/m.help/mod.ts';
import { Process as ProcessOwner } from '../../common.ts';
import { Cli } from '../common.ts';
import { Profiles as ProfilesOwner } from '../mod.ts';
import { GitInitMenu } from '../../u/u.menu.git.init.ts';
import { withInherit } from '../../u/u.inherit.ts';

const Process = { ...ProcessOwner };
const Profiles = {
  ...ProfilesOwner,
  main: (input: Parameters<typeof ProfilesOwner.main>[0]) =>
    withInherit(Process.inherit, () => ProfilesOwner.main(input)),
};

type Chapter = Awaited<ReturnType<typeof PiHelp.Dsl.load>>;

type RunResult = {
  readonly raw: string;
  readonly text: string;
};

const dslCommand = 'deno run -ER jsr:@sys/driver-pi dsl';

describe('@sys/driver-pi/cli/Profiles dsl', () => {
  it('dsl → renders root DSL help without launching Pi or opening startup recovery', async () => {
    const root = await PiHelp.Dsl.load();
    const res = await run(['dsl']);

    expect(res.text).to.contain('@sys/driver-pi dsl');
    expect(res.text).to.contain('Usage');
    expect(res.text).to.contain(`${dslCommand} [chapter...]`);
    expectChapterRendered(res.text, root);
    expect(res.text).to.contain(`${dslCommand} profile`);
    expect(res.text).to.contain(`${dslCommand} tools`);
    expect(res.text).to.contain(`${dslCommand} extensions`);
    expect(res.text).not.to.contain('ocr_pdf');
    expect(res.text).not.to.contain('pdfinfo');
    expect(res.text).not.to.contain('pdftoppm');
    expect(res.text).not.to.contain('brew install poppler tesseract');
  });

  it('dsl <chapter> → renders structural chapters and concrete tool policy links', async () => {
    for (const id of ['profile', 'tools', 'extensions'] as const) {
      const chapter = await PiHelp.Dsl.load([id]);
      const res = await run(['dsl', id]);

      expect(res.text).to.contain(`@sys/driver-pi dsl ${id}`);
      expectChapterRendered(res.text, chapter);
      if (id === 'tools') {
        expect(res.text).to.contain(`${dslCommand} tools remove`);
        expect(res.text).to.contain(`${dslCommand} tools move`);
        expect(res.text).to.contain(`${dslCommand} tools copy`);
        expect(res.text).to.contain(`${dslCommand} tools ocr-pdf`);
      }
    }
  });

  it('dsl tools <chapter> → renders concrete tool policy chapters', async () => {
    for (const id of ['remove', 'move', 'copy', 'ocr-pdf'] as const) {
      const chapter = await PiHelp.Dsl.load(['tools', id]);
      const res = await run(['dsl', 'tools', id]);

      expect(res.text).to.contain(`@sys/driver-pi dsl tools ${id}`);
      expectChapterRendered(res.text, chapter);
      expect(normalizeWhitespace(res.text)).to.contain('restart or relaunch Pi');
    }
  });

  it('dsl tools ocr-pdf → renders OCR PDF enablement boundaries', async () => {
    const res = await run(['dsl', 'tools', 'ocr-pdf']);

    expect(res.text).to.contain('tools.ocr.pdf');
    expect(res.text).to.contain('enabled: true');
    const normalized = normalizeWhitespace(res.text);
    expect(normalized).to.contain('brew install poppler tesseract');
    expect(normalized).to.contain(
      'deno run -A jsr:@sys/tools pi --profile <active-profile> --install-ocr-deps',
    );
    expect(normalized).to.contain('PDF cover read setup answer');
    expect(normalized).to.contain('no callable `ocr_pdf` tool is enabled in this live session');
    expect(normalized).to.contain('OCR output is lossy evidence');
  });

  it('dsl --format skill → renders root skill Markdown without ANSI', async () => {
    const root = await PiHelp.Dsl.load();
    const res = await run(['dsl', '--format', 'skill']);

    expect(res.raw).to.eql(res.text);
    expect(res.text).to.contain('---\nname: "sys-driver-pi-dsl"');
    expect(res.text).to.contain('description: "Guides Pi-Driver profile');
    expectMarkdownChapterRendered(res.text, root);
    root.chapters.forEach((chapter) => {
      expect(res.text).to.contain(`\`${dslCommand} ${chapter.path.join(' ')} --format skill\``);
    });
  });

  it('dsl profile --format skill → renders child skill Markdown', async () => {
    const chapter = await PiHelp.Dsl.load(['profile']);
    const res = await run(['dsl', 'profile', '--format=skill']);

    expect(res.raw).to.eql(res.text);
    expect(res.text).to.contain('---\nname: "sys-driver-pi-dsl-profile"');
    expectMarkdownChapterRendered(res.text, chapter);
    expect(res.text).not.to.contain('@sys/driver-pi dsl profile');
  });

  it('dsl tools --format skill → renders tool policy child links', async () => {
    const chapter = await PiHelp.Dsl.load(['tools']);
    const res = await run(['dsl', 'tools', '--format', 'skill']);

    expect(res.raw).to.eql(res.text);
    expect(res.text).to.contain('---\nname: "sys-driver-pi-dsl-tools"');
    expectMarkdownChapterRendered(res.text, chapter);
    for (const id of ['remove', 'move', 'copy', 'ocr-pdf'] as const) {
      expect(res.text).to.contain(`\`${dslCommand} tools ${id} --format skill\``);
    }
  });

  it('dsl tools ocr-pdf --format skill → renders OCR PDF skill Markdown', async () => {
    const chapter = await PiHelp.Dsl.load(['tools', 'ocr-pdf']);
    const res = await run(['dsl', 'tools', 'ocr-pdf', '--format=skill']);

    expect(res.raw).to.eql(res.text);
    expect(res.text).to.contain('---\nname: "sys-driver-pi-dsl-tools-ocr-pdf"');
    expectMarkdownChapterRendered(res.text, chapter);
    expect(normalizeWhitespace(res.text)).to.contain('brew install poppler tesseract');
  });

  it('dsl → rejects launcher/profile flags before startup', async () => {
    await expectError(['dsl', '--profile', 'default'], 'Unexpected flag for dsl: --profile');
    await expectError(['dsl', '--non-interactive'], 'Unexpected flag for dsl: --non-interactive');
    await expectError(['dsl', '--install-ocr-deps'], 'Unexpected flag for dsl: --install-ocr-deps');
    await expectError(['dsl', '--allow-all'], 'Unexpected flag for dsl: --allow-all');
    await expectError(['dsl', '-A'], 'Unexpected flag for dsl: -A');
  });

  it('dsl → rejects invalid format arguments clearly', async () => {
    await expectError(
      ['dsl', '--format', 'xml'],
      'Unsupported dsl format: xml (expected: human, skill)',
    );
    await expectError(['dsl', '--format'], 'Option requires a value: --format');
    await expectError(
      ['dsl', '--format', 'human', '--format', 'skill'],
      'Repeated option for dsl: --format',
    );
  });

  it('dsl → fails clearly for missing chapters', async () => {
    await expectError(['dsl', 'missing'], 'PiHelp: DSL chapter not found: missing');
    await expectError(
      ['dsl', 'tools', 'missing'],
      'PiHelp: DSL chapter not found: tools missing',
    );
  });
});

function expectChapterRendered(text: string, chapter: Chapter) {
  summaryLines(chapter.summary).forEach((line) => expect(text).to.contain(line));

  chapter.sections.forEach((section) => {
    expect(text).to.contain(section.label);
    section.items.forEach((item) => expectRenderedItem(text, item));
  });
}

function expectMarkdownChapterRendered(text: string, chapter: Chapter) {
  expect(text).to.contain(`# ${chapter.title}`);
  summaryLines(chapter.summary).forEach((line) => expect(text).to.contain(line));

  chapter.sections.forEach((section) => {
    expect(text).to.contain(`## ${section.label}`);
    section.items.forEach((item) => expectRenderedItem(text, item));
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

function summaryLines(summary: string): readonly string[] {
  return summary.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
}

function normalizeWhitespace(input: string): string {
  return input.split(/\s+/).join(' ').trim();
}

async function expectError(argv: readonly string[], message: string) {
  let error = '';
  try {
    await run(argv);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  expect(error).to.eql(message);
}

async function run(argv: readonly string[]): Promise<RunResult> {
  const lines: string[] = [];
  const info = console.info;
  const prevInherit = Process.inherit;
  const prevPrompt = GitInitMenu.prompt;

  try {
    console.info = (value?: unknown) => lines.push(String(value ?? ''));
    Process.inherit = async () => {
      throw new Error('Process.inherit should not run during DSL help.');
    };
    Object.defineProperty(GitInitMenu, 'prompt', {
      value: async () => {
        throw new Error('Git init prompt should not open during DSL help.');
      },
    });

    const res = await Profiles.main({ argv });
    expect(res.kind).to.eql('help');

    const raw = lines.join('\n');
    return { raw, text: Cli.stripAnsi(raw) };
  } finally {
    console.info = info;
    Process.inherit = prevInherit;
    Object.defineProperty(GitInitMenu, 'prompt', { value: prevPrompt });
  }
}
