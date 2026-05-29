import { Cli, describe, expect, it } from '../../../-test.ts';
import { WorkspaceDelta } from '../../mod.ts';
import { Fixture } from '../../-test/u.fixture.ts';

describe('@sys/workspace Delta.Fmt', () => {
  it('explains git-derived root selection with bounded changed-file evidence', async () => {
    const { cwd, graphPath } = await Fixture.gitBaselineWorkspace();

    const delta = await WorkspaceDelta.Git.fromRef({ cwd, graphPath, ref: 'baseline' });
    const text = Cli.stripAnsi(WorkspaceDelta.Fmt.explain({ delta, maxFilesPerPackage: 1 }));

    expect(text).to.include('Delta: baseline → HEAD');
    expect(text).to.include('Changed files: 7');
    expect(text).to.include('Changed packages: 3');
    expect(text).to.include('Bump roots: @scope/a');
    expect(text).to.include('@scope/a  code/pkg-a  needs bump');
    expect(text).to.include('  • src/mod.ts');
    expect(text).to.include('@scope/b  code/pkg-b  already bumped');
    expect(text).to.include('@scope/c  code/pkg-c  new');
    expect(text).to.include('  • … 1 more');
    expect(text).to.include('Skipped files: 2');
  });
});
