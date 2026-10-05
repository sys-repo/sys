import { FileMap } from '@sys/fs';
import { describe, expect, Fs, it, Obj, type t } from '../../-test.ts';
import { json as bundled } from '../-bundle/-bundle.ts';
import { CellHelp } from '../mod.ts';
import { HelpResource, resolveChapterResource } from '../u/u.paths.ts';

describe('CellHelp.Dsl', () => {
  it('freezes the public namespace graph', () => {
    const values = [
      CellHelp,
      CellHelp.Root,
      CellHelp.Info,
      CellHelp.Init,
      CellHelp.Migrate,
      CellHelp.Task,
      CellHelp.Start,
      CellHelp.Kill,
      CellHelp.Dsl,
    ];
    for (const value of values) expect(Object.isFrozen(value)).to.eql(true);
  });

  it('bundled help matches every current owner source file', async () => {
    const root = Fs.resolve(import.meta.dirname ?? '.', '..');
    const files = new Set(HelpResource.Source.Files);
    const fileMap = await FileMap.toMap(root, { filter: (e) => files.has(e.path) });
    expect(Obj.keys(fileMap)).to.eql([...files].sort());
    expect(fileMap).to.eql(bundled);
  });

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

  it('bundled pulled-view help → independent content pins, never manifest-byte authority', async () => {
    const chapter = await CellHelp.Dsl.load(['pulled-view']);
    const text = chapter.sections.flatMap((section) => section.items).join('\n');
    expect(text).to.include('--scheme sys.dist/v2 --digest <digest>');
    expect(text).to.include('Reject pins calculated from the same download');
    expect(text).to.include('never relabel or automatically repin');
    expect(text).to.include('content-addressed store');
    expect(text).to.include('point-in-time, not filesystem immutability');
    expect(text).to.include('does not promise rollback');
    expect(text).not.to.include('immutable store');
    expect(text).not.to.include('--integrity');
    expect(text).not.to.include('SHA-256 of those exact manifest bytes');
  });

  it('pulled-view setup → confirm resolved destinations under the owner path rules', async () => {
    const chapter = await CellHelp.Dsl.load(['pulled-view']);
    const text = chapter.sections.flatMap((section) => section.items).join('\n');
    expect(text).to.include('confirm the resolved absolute store and projection destinations');
    expect(text).to.include('anchor two levels above the YAML directory');
    expect(text).to.include('resolve destinations again before seeking confirmation');
    expect(text).to.include(
      'https://github.com/sys-repo/sys/blob/main/code/sys.tools/README.md#content-pinned-dist-bundles',
    );
  });

  it('pulled-view materialization → projection and static Serve do not inherit verification', async () => {
    const chapter = await CellHelp.Dsl.load(['pulled-view']);
    const text = chapter.sections.flatMap((section) => section.items).join('\n');
    expect(text).to.include(
      'Verification remains with the stored generation, not its mutable projection',
    );
    expect(text).to.include('projection HTML after promotion');
    expect(text).to.include('`@sys/tools/serve` does not verify payload bytes');
    expect(text).to.include(
      'https://github.com/sys-repo/sys/blob/main/code/sys/server/README.md#compose-the-dist-lifecycle-with-syscell',
    );
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
