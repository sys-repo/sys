import { describe, expect, it } from './-test.ts';
import { WorkspaceBump } from './m.bump/mod.ts';
import { WorkspaceCi } from './m.ci/mod.ts';
import { WorkspaceCli } from './m.cli/mod.ts';
import { WorkspaceGraph } from './m.graph/mod.ts';
import { WorkspaceInfo } from './m.info/mod.ts';
import { WorkspacePkg } from './m.pkg/mod.ts';
import { WorkspacePrep } from './m.prep/mod.ts';
import { WorkspaceRun } from './m.run/mod.ts';
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
    expect(m.Workspace.Graph).to.equal(WorkspaceGraph);
    expect(m.Workspace.Ci).to.equal(WorkspaceCi);
    expect(m.Workspace.Ci.Jsr).to.equal(WorkspaceCi.Jsr);
    expect(m.Workspace.Ci.Build).to.equal(WorkspaceCi.Build);
    expect(m.Workspace.Ci.Test).to.equal(WorkspaceCi.Test);
    expect(m.Workspace.Prep).to.equal(WorkspacePrep);
    expect(m.Workspace.Run).to.equal(WorkspaceRun);
  });
});
