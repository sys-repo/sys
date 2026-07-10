import { describe, expect, it } from '../../../-test.ts';
import { PiHelp } from '../mod.ts';

const structuralChapters = ['extensions', 'profile', 'tools'] as const;
const toolPolicyChapters = ['copy', 'move', 'ocr-pdf', 'remove'] as const;

describe('@sys/driver-pi/m.help', () => {
  it('loads the root DSL chapter with the structural chapter index', async () => {
    const root = await PiHelp.Dsl.load();

    expect(root.id).to.eql('dsl');
    expect(root.path).to.eql([]);
    expect(root.title).to.eql('Pi-Driver DSL');
    expect(root.chapters.map((chapter) => chapter.id).sort()).to.eql([...structuralChapters]);
    expect(root.chapters.some((chapter) => chapter.id === 'ocr-pdf')).to.eql(false);
  });

  it('loads structural DSL chapters by path', async () => {
    for (const id of structuralChapters) {
      const chapter = await PiHelp.Dsl.load([id]);

      expect(chapter.id).to.eql(id);
      expect(chapter.path).to.eql([id]);
      if (id === 'tools') {
        expect(chapter.chapters.map((item) => item.id).sort()).to.eql([...toolPolicyChapters]);
      } else {
        expect(chapter.chapters).to.eql([]);
      }
      if (id === 'profile') {
        const text = chapterText(chapter);
        expect(text).to.contain('Named profiles resolve to `-config/@sys.driver-pi/<name>.yaml`');
        expect(text).to.contain(
          '`--profile <name|path>` loads a named profile or an explicit profile YAML file',
        );
        expect(text).to.contain('Ordinary arguments after `--` pass through to Pi unchanged');
        expect(text).to.contain(
          'passthrough for those surfaces is rejected',
        );
      }
    }
  });

  it('loads concrete tool policy DSL chapters by path', async () => {
    for (const id of toolPolicyChapters) {
      const chapter = await PiHelp.Dsl.load(['tools', id]);

      expect(chapter.id).to.eql(id);
      expect(chapter.path).to.eql(['tools', id]);
      expect(chapter.chapters).to.eql([]);
      if (id === 'ocr-pdf') {
        const text = chapterText(chapter);
        expect(text).to.contain('Default OCR PDF policy is disabled');
        expect(text).to.contain('Available explicit fields for an enabled OCR PDF policy');
        expect(text).to.contain('Do not copy every field by default');
        expect(text).to.contain('`      timeoutMs: 120000`');
        expect(text).to.contain(
          'Tesseract language data for configured `languages` and `defaultLanguage`',
        );
        expect(text).to.contain('Sandbox previews do not run OCR probes');
        expect(text).to.contain('`--install-ocr-deps`');
        expect(text).to.contain(
          'deno run -A jsr:@sys/tools pi --profile <active-profile> --install-ocr-deps',
        );
        expect(text).to.contain('never resolves executables from ambient `PATH`');
      }
    }
  });

  it('fails clearly when a DSL chapter path is missing', async () => {
    let error: Error | undefined;

    try {
      await PiHelp.Dsl.load(['tools', 'missing']);
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.eql('PiHelp: DSL chapter not found: tools missing');
  });
});

function chapterText(chapter: Awaited<ReturnType<typeof PiHelp.Dsl.load>>) {
  return [
    chapter.summary,
    ...chapter.sections.flatMap((section) => [section.label, ...section.items]),
  ].join('\n');
}
