import { Cli, describe, expect, it } from '../../../-test.ts';
import { WorkspaceDelta } from '../../mod.ts';
import { Fixture } from '../../-test/u.fixture.ts';
import { fileLines } from '../u.files.ts';

describe('@sys/workspace Delta.Fmt', () => {
  it('explains git-derived root selection with bounded changed-file evidence', async () => {
    const { cwd, graphPath } = await Fixture.gitBaselineWorkspace();

    const delta = await WorkspaceDelta.Git.fromRef({ cwd, graphPath, ref: 'baseline' });
    const text = Cli.stripAnsi(
      WorkspaceDelta.Fmt.explain({ delta, maxFilesPerPackage: 1, width: 80 }),
    );

    expect(text).to.include('delta      baseline → HEAD');
    expect(text).to.include('files      7');
    expect(text).to.include('packages   3');
    expect(text).to.include('roots      @scope/a');
    expect(text).to.include('@scope/a • code/pkg-a ← needs bump');
    expect(text).to.include('  src/mod.ts');
    expect(text).to.include('@scope/b • code/pkg-b ← already bumped');
    expect(text).to.include('@scope/c • code/pkg-c ← new');
    expect(text).to.include('  +1 more');
    expect(text).to.include('Skipped files: 2');
  });

  it('formats changed-file evidence as an adaptive two-column table', () => {
    const files = Array.from({ length: 12 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0');
      return `code/pkg/src/file-${number}.ts`;
    });
    const text = Cli.stripAnsi(fileLines('code/pkg', files, { width: 120, rows: 5 }).join('\n'));
    const lines = text.split('\n');

    expect(lines.length).to.eql(6);
    expect(lines[0]).to.include('  src/file-01.ts');
    expect(lines[0]).to.include('src/file-06.ts');
    expect(lines[4]).to.include('src/file-05.ts');
    expect(lines[4]).to.include('src/file-10.ts');
    expect(lines[5]).to.eql('  +2 more');
    expect(text).not.to.include('•');
  });
});
