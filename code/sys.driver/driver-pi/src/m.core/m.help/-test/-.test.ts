import { describe, expect, it } from '../../../-test.ts';
import { PiHelp } from '../mod.ts';

const structuralChapters = ['extensions', 'profile', 'tools'] as const;
const filesystemToolChapters = ['copy', 'move', 'remove'] as const;

describe('@sys/driver-pi/m.help', () => {
  it('loads the root DSL chapter with the structural chapter index', async () => {
    const root = await PiHelp.Dsl.load();

    expect(root.id).to.eql('dsl');
    expect(root.path).to.eql([]);
    expect(root.title).to.eql('Driver-Pi DSL');
    expect(root.chapters.map((chapter) => chapter.id).sort()).to.eql([...structuralChapters]);
    expect(root.chapters.some((chapter) => chapter.id === 'ocr-pdf')).to.eql(false);
  });

  it('loads structural DSL chapters by path', async () => {
    for (const id of structuralChapters) {
      const chapter = await PiHelp.Dsl.load([id]);

      expect(chapter.id).to.eql(id);
      expect(chapter.path).to.eql([id]);
      if (id === 'tools') {
        expect(chapter.chapters.map((item) => item.id).sort()).to.eql([...filesystemToolChapters]);
      } else {
        expect(chapter.chapters).to.eql([]);
      }
    }
  });

  it('loads concrete filesystem tool DSL chapters by path', async () => {
    for (const id of filesystemToolChapters) {
      const chapter = await PiHelp.Dsl.load(['tools', id]);

      expect(chapter.id).to.eql(id);
      expect(chapter.path).to.eql(['tools', id]);
      expect(chapter.chapters).to.eql([]);
    }
  });

  it('fails clearly when a DSL chapter path is missing', async () => {
    let error: Error | undefined;

    try {
      await PiHelp.Dsl.load(['tools', 'ocr-pdf']);
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.eql('PiHelp: DSL chapter not found: tools ocr-pdf');
  });
});
