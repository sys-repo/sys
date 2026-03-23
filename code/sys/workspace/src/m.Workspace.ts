import type { t } from './common.ts';
import { WorkspaceCi as Ci } from './m.ci/mod.ts';
import { WorkspaceInfo as Info } from './m.info/mod.ts';
import { WorkspacePkg as Pkg } from './m.pkg/mod.ts';
import { WorkspaceUpgrade as Upgrade } from './m.upgrade/mod.ts';

/** Root workspace helper library. */
export const Workspace: t.Workspace.Lib = { Ci, Pkg, Info, Upgrade };
