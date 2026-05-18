import { describe, expect, it, type t } from '../../-test.ts';
import { Help } from '../mod.ts';

function chapterText(chapter: t.Help.Dsl.Chapter): string {
  return chapter.sections.flatMap((section) => section.items).join('\n');
}

describe('Tools Help', () => {
  it('loads the root DSL chapter with the serve chapter index', async () => {
    const chapter = await Help.Dsl.load();
    const text = chapterText(chapter);

    expect(chapter.id).to.eql('dsl');
    expect(chapter.path).to.eql([]);
    expect(chapter.title).to.eql('Tools DSL');
    expect(chapter.chapters.map((child) => child.id)).to.eql(['serve']);
    expect(text).to.contain('Published chapter: `serve`.');
  });

  it('loads the serve DSL chapter by path', async () => {
    const chapter = await Help.Dsl.load(['serve']);
    const text = chapterText(chapter);

    expect(chapter.id).to.eql('serve');
    expect(chapter.path).to.eql(['serve']);
    expect(chapter.title).to.eql('Serve DSL');
    expect(chapter.chapters).to.eql([]);
    expect(text).to.contain('`dir` is the filesystem root');
    expect(text).to.contain('Verify the concrete final URL');
  });
});
