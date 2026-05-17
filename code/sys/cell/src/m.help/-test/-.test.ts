import { describe, expect, it, type t } from '../../-test.ts';
import { CellHelp } from '../mod.ts';
import { HelpResource, resolveChapterResource } from '../u/u.paths.ts';

describe('CellHelp.Dsl', () => {
  it('loads the root DSL chapter as a concise chapter index', async () => {
    const chapter = await CellHelp.Dsl.load();
    const text = chapterText(chapter);

    expect(chapter.id).to.eql('dsl');
    expect(chapter.path).to.eql([]);
    expect(chapter.title).to.eql('Cell DSL');
    expect(chapter.sections.map((section) => section.label)).to.eql([
      'Agent reading protocol',
      'Runtime authority',
      'Rule',
      'Descriptor IDs',
      'Speech acts',
      'Owners',
      'Diagnostics',
      'Mappings',
    ]);
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
    expect(text).to.contain('add service mode <mode>');
    expect(text).to.contain('variants.<mode>');
    expect(text).to.contain('same `@sys/cell` runtime authority');
    expect(text).to.contain('/services: Unexpected property');
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
      'Service modes',
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
      'Verification',
      'Project task',
      'Services',
    ]);
    expect(chapter.chapters).to.eql([]);
  });

  it('loads the examples DSL chapter by path', async () => {
    const chapter = await CellHelp.Dsl.load(['examples']);
    const text = chapterText(chapter);

    expect(chapter.id).to.eql('examples');
    expect(chapter.path).to.eql(['examples']);
    expect(chapter.title).to.eql('Cell DSL examples');
    expect(chapter.sections.map((section) => section.label)).to.eql([
      'Rule',
      'Common prompt shapes',
      'Sample slot values',
      'Descriptor shapes',
      'Owner flow reminders',
      'Source-reading guardrail',
    ]);
    expect(chapter.chapters).to.eql([]);
    expect(text).to.contain('fs.db.team');
    expect(text).to.contain('jsr:@sys/driver-stripe/server/fixture');
    expect(text).to.contain('StripeFixture');
    expect(text).to.contain('services:');
    expect(text).to.contain('tasks:');
  });

  it('keeps branded examples out of generic operation chapters', async () => {
    const service = chapterText(await CellHelp.Dsl.load(['service']));
    const proxy = chapterText(await CellHelp.Dsl.load(['proxy-service']));

    expect(service).to.not.contain('StripeFixture');
    expect(service).to.not.contain('fs.db.team');
    expect(proxy).to.not.contain('StripeFixture');
    expect(proxy).to.not.contain('fs.db.team');
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

function chapterText(chapter: t.CellHelp.Dsl.Chapter): string {
  return chapter.sections.flatMap((section) => section.items).join('\n');
}

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}
