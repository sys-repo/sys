import { describe, expect, it, type t } from '../../-test.ts';
import { Help } from '../mod.ts';

describe('Tools Help', () => {
  it('loads the root DSL chapter with the chapter index', async () => {
    const chapter = await Help.Dsl.load();
    const text = chapterText(chapter);

    expect(chapter.id).to.eql('dsl');
    expect(chapter.path).to.eql([]);
    expect(chapter.title).to.eql('Tools DSL');
    expect(labelsOf(chapter)).to.eql([
      'Agent protocol',
      'Rule',
      'Chapter policy',
      'Help and authority',
      'Current chapters',
    ]);
    expect(chapter.chapters.map((child) => child.id)).to.eql(['serve', 'deploy']);
    expect(text).to.contain('Published chapters: `serve`, `deploy`.');
  });

  it('loads the serve DSL chapter by path', async () => {
    const chapter = await Help.Dsl.load(['serve']);

    expect(chapter.id).to.eql('serve');
    expect(chapter.path).to.eql(['serve']);
    expect(chapter.title).to.eql('Serve DSL');
    expect(labelsOf(chapter)).to.eql(['Rule', 'Base path check']);
    expect(chapter.chapters).to.eql([]);
    expect(textOf(chapter, 'Rule')).to.contain('`dir` is the filesystem root');
    expect(textOf(chapter, 'Base path check')).to.contain('Verify the concrete final URL');
  });

  it('loads the deploy DSL chapter by path', async () => {
    const chapter = await Help.Dsl.load(['deploy']);

    expect(chapter.id).to.eql('deploy');
    expect(chapter.path).to.eql(['deploy']);
    expect(chapter.title).to.eql('Deploy DSL');
    expect(chapter.summary).to.eql(
      'Deploy snapshot replacement, provider push, R2 Files publishing, and force repair mode.',
    );
    expect(labelsOf(chapter)).to.eql([
      'Rule',
      'Stage and push boundary',
      'Snapshot replacement',
      'Provider boundaries',
      'R2 Files publishing',
      'Force repair mode',
      'Publish stats and reports',
      'Verification',
    ]);
    expect(chapter.chapters).to.eql([]);

    expect(textOf(chapter, 'Rule')).to.contain('Deploy is snapshot replacement');
    expect(textOf(chapter, 'Rule')).to.contain('not incremental remote filesystem copy');

    const snapshot = textOf(chapter, 'Snapshot replacement');
    expect(snapshot).to.contain('stale deploy drift');
    expect(snapshot).to.contain('prune stale remote files by default');
    expect(snapshot).to.contain('Do not add a `publish.stale` deploy schema option');

    const r2 = textOf(chapter, 'R2 Files publishing');
    expect(r2).to.contain('Files.Client.writeBytes');
    expect(r2).to.contain('Files remove boundary');

    const force = textOf(chapter, 'Force repair mode');
    expect(force).to.contain('Force is not the prune switch');
    expect(force).to.contain('Force must not verify arbitrary remote bytes');

    const stats = textOf(chapter, 'Publish stats and reports');
    expect(stats).to.contain('Prune stats are separate facts');
    expect(stats).to.contain('not green uploads');

    const verification = textOf(chapter, 'Verification');
    expect(verification).to.contain('R2 provider tests own stale listing');
    expect(verification).to.contain('force+prune ordering');
  });
});

/**
 * Helpers:
 */
function chapterText(chapter: t.Help.Dsl.Chapter): string {
  return normalize(chapter.sections.flatMap((section) => section.items).join('\n'));
}

function labelsOf(chapter: t.Help.Dsl.Chapter): readonly string[] {
  return chapter.sections.map((section) => section.label);
}

function textOf(chapter: t.Help.Dsl.Chapter, label: string): string {
  const section = chapter.sections.find((section) => section.label === label);
  if (!section) throw new Error(`Missing DSL section: ${label}`);
  return normalize(section.items.join('\n'));
}

function normalize(input: string): string {
  return input.split(/\s+/).join(' ').trim();
}
