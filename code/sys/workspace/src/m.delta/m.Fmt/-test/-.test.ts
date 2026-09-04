import { c, Cli, describe, expect, it } from '../../../-test.ts';
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
    expect(fileLines('code/pkg', files, { width: 120, rows: 5 }).join('\n')).to.include(
      c.dim(c.italic(c.cyan('+2 more'))),
    );
    expect(text).not.to.include('•');
  });

  it('formats changed-file paths as muted available-width table cells', () => {
    const short = fileLines('code/pkg', [
      'code/pkg/src/file.ts',
      'code/pkg/src/other.ts',
    ], { width: 80, rows: 1 }).join('\n');
    expect(short).to.include(c.dim(c.gray('src/file.ts')));

    const files = [
      'code/pkg/src/feature/deeply/nested/left-alpha.ts',
      'code/pkg/src/feature/deeply/nested/left-beta.ts',
      'code/pkg/src/feature/deeply/nested/right-alpha.ts',
      'code/pkg/src/feature/deeply/nested/right-beta.ts',
    ];
    const rich = fileLines('code/pkg', files, { width: 44, rows: 2 }).join('\n');
    const text = Cli.stripAnsi(rich);
    const lines = text.split('\n');

    expect(lines.length).to.eql(2);
    lines.forEach((line) => expect(line.length).to.be.lessThan(45));
    expect(text).to.include('…');
    expect(text).not.to.include('./src/');
    expect(rich).to.include(c.dim(c.gray('…')));
    expect(rich).not.to.include(c.cyan('…'));
  });
});
