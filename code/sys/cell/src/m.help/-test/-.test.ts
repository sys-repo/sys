import { describe, expect, it, type t } from '../../-test.ts';
import { CellHelp } from '../mod.ts';
import { HelpResource, resolveChapterResource } from '../u/u.paths.ts';

describe('CellHelp.Dsl', () => {
  it('loads the root DSL chapter index', async () => {
    const chapter = await CellHelp.Dsl.load();

    expect(chapter.id).to.eql('dsl');
    expect(chapter.path).to.eql([]);
    expect(chapter.title).to.eql('Cell DSL');
    expect(chapter.summary.length).to.be.greaterThan(0);
    expect(chapter.sections.length).to.be.greaterThan(0);
    expect(chapter.chapters.map((child) => child.id)).to.eql([
      'pulled-view',
      'static-serve-service',
      'service',
      'proxy-service',
      'start-services',
      'examples',
    ]);
    chapter.chapters.forEach((child) => {
      expect(child.path).to.eql([child.id]);
      expect(child.title.length).to.be.greaterThan(0);
      expect(child.summary.length).to.be.greaterThan(0);
    });
  });

  it('loads child DSL chapters by path', async () => {
    const root = await CellHelp.Dsl.load();

    for (const link of root.chapters) {
      const chapter = await CellHelp.Dsl.load(link.path);

      expect(chapter.id).to.eql(link.id);
      expect(chapter.path).to.eql(link.path);
      expect(chapter.title.length).to.be.greaterThan(0);
      expect(chapter.summary.length).to.be.greaterThan(0);
      expect(chapter.sections.length).to.be.greaterThan(0);
      expect(chapter.chapters).to.eql([]);
      chapter.sections.forEach((section) => {
        expect(section.label.length).to.be.greaterThan(0);
        expect(section.items.length).to.be.greaterThan(0);
      });
    }
  });

  it('fails clearly when a DSL chapter path is missing', async () => {
    const error = await catchError(() => CellHelp.Dsl.load(['missing']));

    expect(error?.message).to.contain('CellHelp: DSL chapter not found: missing');
  });

  it('resolves nested chapter resources recursively', () => {
    const root: t.CellHelp.Dsl.ChapterResource = {
      id: 'dsl',
      file: HelpResource.Dsl.Root.file,
      children: [
        {
          id: 'pulled-view',
          file: HelpResource.Dsl.Root.children[0].file,
          children: [
            {
              id: 'materialize',
              file: HelpResource.Dsl.Root.children[0].file,
              children: [],
            },
          ],
        },
      ],
    };

    expect(resolveChapterResource(root, [])?.id).to.eql('dsl');
    expect(resolveChapterResource(root, ['pulled-view'])?.id).to.eql('pulled-view');
    expect(resolveChapterResource(root, ['pulled-view', 'materialize'])?.id).to.eql('materialize');
    expect(resolveChapterResource(root, ['pulled-view', 'missing'])).to.eql(undefined);
  });
});

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}
