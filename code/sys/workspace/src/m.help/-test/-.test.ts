import { describe, expect, expectError, FileMap, Fs, it } from './common.ts';
import { json } from '../-bundle/-bundle.ts';
import { WorkspaceHelp } from '../mod.ts';
import { HelpResource } from '../u/u.paths.ts';

describe('WorkspaceHelp', () => {
  describe('resource graph', () => {
    it('loads nonempty root package guidance', async () => {
      const root = await WorkspaceHelp.Root.load();

      expect(root.summary.length).to.be.greaterThan(0);
      expect(root.sections.length).to.be.greaterThan(0);
      root.sections.forEach((section) => {
        expect(section.label.length).to.be.greaterThan(0);
        expect(section.items.length).to.be.greaterThan(0);
      });
    });

    it('loads the root DSL chapter and registered child links', async () => {
      const chapter = await WorkspaceHelp.Dsl.load();

      expect({ id: chapter.id, path: chapter.path }).to.eql({ id: 'dsl', path: [] });
      expect(chapter.sections.length).to.be.greaterThan(0);
      expect(chapter.chapters.map(({ id, path }) => ({ id, path }))).to.eql([
        { id: 'delta', path: ['delta'] },
        { id: 'test', path: ['test'] },
      ]);
    });

    it('loads each registered leaf chapter', async () => {
      const [delta, test] = await Promise.all([
        WorkspaceHelp.Dsl.load(['delta']),
        WorkspaceHelp.Dsl.load(['test']),
      ]);

      expect([delta, test].map(({ id, path, chapters }) => ({ id, path, chapters }))).to.eql([
        { id: 'delta', path: ['delta'], chapters: [] },
        { id: 'test', path: ['test'], chapters: [] },
      ]);
      [delta, test].forEach((chapter) => {
        expect(chapter.sections.length).to.be.greaterThan(0);
      });
    });
  });

  describe('bundle authority', () => {
    it('keeps authored resources byte-identical to the embedded bundle', async () => {
      expect(Object.keys(json)).to.eql([...HelpResource.Source.Files].sort());

      const root = Fs.resolve(import.meta.dirname ?? '.', '..');
      for (const file of HelpResource.Source.Files) {
        const source = await Fs.readText(Fs.join(root, file));
        if (!source.ok) throw source.error;
        expect(FileMap.Data.decode(json[file])).to.eql(source.data);
      }
    });
  });

  describe('failure reporting', () => {
    it('reports unknown DSL chapter paths clearly', async () => {
      const error = await expectError(() => WorkspaceHelp.Dsl.load(['missing']));

      expect(error.message).to.eql('WorkspaceHelp: DSL chapter not found: missing');
    });
  });
});
