import { describe, expect, it, type t } from '../../-test.ts';
import { CellHelp } from '../mod.ts';
import { HelpResource, resolveChapterResource } from '../u/u.paths.ts';

describe('CellHelp.Dsl', () => {
  it('loads the root DSL chapter as a concise chapter index', async () => {
    const chapter = await CellHelp.Dsl.load();

    expect(chapter.id).to.eql('dsl');
    expect(chapter.path).to.eql([]);
    expect(chapter.title).to.eql('Cell DSL');
    expect(chapter.sections.map((section) => section.label)).to.eql([
      'Rule',
      'Speech acts',
      'Owners',
      'Mappings',
    ]);
    expect(chapter.chapters.map((child) => child.id)).to.eql(['pulled-view']);
    expect(chapter.chapters[0].path).to.eql(['pulled-view']);
    expect(chapter.chapters[0].summary).to.eql('Add a view backed by an `@sys/tools/pull` config.');
  });

  it('loads child DSL chapters by path', async () => {
    const chapter = await CellHelp.Dsl.load(['pulled-view']);

    expect(chapter.id).to.eql('pulled-view');
    expect(chapter.path).to.eql(['pulled-view']);
    expect(chapter.title).to.eql('Pulled view');
    expect(chapter.summary).to.eql('Add a view backed by an `@sys/tools/pull` config.');
    expect(chapter.sections.map((section) => section.label)).to.eql([
      'Rule',
      'Slot policy',
      'Dialogue',
      'Owner flow',
      'Materialize',
    ]);
    expect(chapter.chapters).to.eql([]);
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
