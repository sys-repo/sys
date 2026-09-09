import { describe, expect, it } from './-test.ts';
import { WorkspaceBump } from './m.bump/mod.ts';
import { WorkspaceCi } from './m.ci/mod.ts';
import { WorkspaceCli } from './m.cli/mod.ts';
import { WorkspaceDelta } from './m.delta/mod.ts';
import { WorkspaceGraph } from './m.graph/mod.ts';
import { WorkspaceInfo } from './m.info/mod.ts';
import { WorkspacePkg } from './m.pkg/mod.ts';
import { WorkspacePrep } from './m.prep/mod.ts';
import { WorkspaceResolve } from './m.resolve/mod.ts';
import { WorkspaceRun } from './m.run/mod.ts';
import { Workspace as TestingWorkspace, WorkspaceTesting } from './m.testing/mod.ts';
import { WorkspaceUpgrade } from './m.upgrade/mod.ts';
import { Workspace } from './mod.ts';

describe(`@sys/workspace`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace');
    expect(m.Workspace).to.equal(Workspace);
    expect(m.Workspace.Bump).to.equal(WorkspaceBump);
    expect(m.Workspace.Pkg).to.equal(WorkspacePkg);
    expect(m.Workspace.Info).to.equal(WorkspaceInfo);
    expect(m.Workspace.Upgrade).to.equal(WorkspaceUpgrade);
    expect(m.Workspace.Cli).to.equal(WorkspaceCli);
    expect(m.Workspace.Delta).to.equal(WorkspaceDelta);
    expect(m.Workspace.Graph).to.equal(WorkspaceGraph);
    expect(m.Workspace.Ci).to.equal(WorkspaceCi);
    expect(m.Workspace.Ci.Jsr).to.equal(WorkspaceCi.Jsr);
    expect(m.Workspace.Ci.Build).to.equal(WorkspaceCi.Build);
    expect(m.Workspace.Ci.Test).to.equal(WorkspaceCi.Test);
    expect(m.Workspace.Prep).to.equal(WorkspacePrep);
    expect(m.Workspace.Run).to.equal(WorkspaceRun);
  });

  it('freezes the public namespace graph', () => {
    const values: readonly [string, object][] = [
      ['Workspace', Workspace],
      ['Workspace.Bump', Workspace.Bump],
      ['Workspace.Bump.Args', Workspace.Bump.Args],
      ['Workspace.Bump.Fmt', Workspace.Bump.Fmt],
      ['Workspace.Pkg', Workspace.Pkg],
      ['Workspace.Pkg.Fmt', Workspace.Pkg.Fmt],
      ['Workspace.Info', Workspace.Info],
      ['Workspace.Upgrade', Workspace.Upgrade],
      ['Workspace.Ci', Workspace.Ci],
      ['Workspace.Ci.Jsr', Workspace.Ci.Jsr],
      ['Workspace.Ci.Jsr.Is', Workspace.Ci.Jsr.Is],
      ['Workspace.Ci.Build', Workspace.Ci.Build],
      ['Workspace.Ci.Test', Workspace.Ci.Test],
      ['Workspace.Ci.Fmt', Workspace.Ci.Fmt],
      ['Workspace.Cli', Workspace.Cli],
      ['Workspace.Delta', Workspace.Delta],
      ['Workspace.Delta.Fmt', Workspace.Delta.Fmt],
      ['Workspace.Delta.Git', Workspace.Delta.Git],
      ['Workspace.Graph', Workspace.Graph],
      ['Workspace.Graph.Snapshot', Workspace.Graph.Snapshot],
      ['Workspace.Prep', Workspace.Prep],
      ['Workspace.Prep.State', Workspace.Prep.State],
      ['Workspace.Prep.Deps', Workspace.Prep.Deps],
      ['Workspace.Prep.Fmt', Workspace.Prep.Fmt],
      ['Workspace.Prep.Graph', Workspace.Prep.Graph],
      ['Workspace.Prep.Workspace', Workspace.Prep.Workspace],
      ['Workspace.Run', Workspace.Run],
      ['Workspace.Run.Args', Workspace.Run.Args],
      ['Workspace.Run.Fmt', Workspace.Run.Fmt],
      ['WorkspaceResolve', WorkspaceResolve],
      ['WorkspaceTesting', WorkspaceTesting],
      ['Workspace.Test', TestingWorkspace],
    ];

    for (const [label, value] of values) {
      expect(Object.isFrozen(value), label).to.eql(true);
    }
  });
});
