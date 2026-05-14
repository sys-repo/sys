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
      'Agent reading protocol',
      'Rule',
      'Descriptor IDs',
      'Speech acts',
      'Owners',
      'Mappings',
    ]);
    expect(chapter.chapters.map((child) => child.id)).to.eql([
      'pulled-view',
      'static-serve-service',
      'service',
      'proxy-service',
      'start-services',
    ]);
    chapter.chapters.forEach((child) => {
      expect(child.path).to.eql([child.id]);
      expect(child.title.length).to.be.greaterThan(0);
      expect(child.summary.length).to.be.greaterThan(0);
    });
  });

  it('loads child DSL chapters by path', async () => {
    const chapter = await CellHelp.Dsl.load(['pulled-view']);

    expect(chapter.id).to.eql('pulled-view');
    expect(chapter.path).to.eql(['pulled-view']);
    expect(chapter.title.length).to.be.greaterThan(0);
    expect(chapter.summary.length).to.be.greaterThan(0);
    expect(chapter.sections.map((section) => section.label)).to.eql([
      'Rule',
      'Slot policy',
      'Dialogue',
      'Owner flow',
      'Materialize',
    ]);
    expect(chapter.chapters).to.eql([]);
  });

  it('loads the static serve service DSL chapter by path', async () => {
    const chapter = await CellHelp.Dsl.load(['static-serve-service']);

    expect(chapter.id).to.eql('static-serve-service');
    expect(chapter.path).to.eql(['static-serve-service']);
    expect(chapter.title.length).to.be.greaterThan(0);
    expect(chapter.summary.length).to.be.greaterThan(0);
    expect(chapter.sections.map((section) => section.label)).to.eql([
      'Rule',
      'Slot policy',
      'Dialogue',
      'Owner flow',
      'Owner config',
      'Descriptor patch',
    ]);
    expect(chapter.chapters).to.eql([]);
  });

  it('loads the service DSL chapter by path', async () => {
    const chapter = await CellHelp.Dsl.load(['service']);

    expect(chapter.id).to.eql('service');
    expect(chapter.path).to.eql(['service']);
    expect(chapter.title.length).to.be.greaterThan(0);
    expect(chapter.summary.length).to.be.greaterThan(0);
    expect(chapter.sections.map((section) => section.label)).to.eql([
      'Rule',
      'Slot policy',
      'Lifecycle contract',
      'Dialogue',
      'Owner flow',
      'Descriptor patch',
    ]);
    expect(chapter.chapters).to.eql([]);
  });

  it('loads the proxy service DSL chapter by path', async () => {
    const chapter = await CellHelp.Dsl.load(['proxy-service']);

    expect(chapter.id).to.eql('proxy-service');
    expect(chapter.path).to.eql(['proxy-service']);
    expect(chapter.title.length).to.be.greaterThan(0);
    expect(chapter.summary.length).to.be.greaterThan(0);
    expect(chapter.sections.map((section) => section.label)).to.eql([
      'Rule',
      'Slot policy',
      'Dialogue',
      'Owner flow',
      'Owner command',
      'Root routes',
      'Descriptor patch',
    ]);
    expect(chapter.chapters).to.eql([]);
  });

  it('loads the start services DSL chapter by path', async () => {
    const chapter = await CellHelp.Dsl.load(['start-services']);

    expect(chapter.id).to.eql('start-services');
    expect(chapter.path).to.eql(['start-services']);
    expect(chapter.title.length).to.be.greaterThan(0);
    expect(chapter.summary.length).to.be.greaterThan(0);
    expect(chapter.sections.map((section) => section.label)).to.eql([
      'Rule',
      'Operator flow',
      'Command',
      'Project task',
      'Services',
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
