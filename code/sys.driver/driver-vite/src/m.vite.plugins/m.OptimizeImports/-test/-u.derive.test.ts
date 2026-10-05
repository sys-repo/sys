import { describe, expect, ROOT, it } from '../../../-test.ts';
import { workspace } from '../../../m.vite.config.workspace/mod.ts';
import { deriveWorkspacePackageRules } from '../u.derive.ts';

describe('OptimizeImportsPlugin.deriveWorkspacePackageRules', () => {
  it('derives safe public narrow-import rules from workspace exports and barrels', async () => {
    const ws = await workspace({ denofile: ROOT.denofile.path, walkup: false });
    const rules = await deriveWorkspacePackageRules(ws);

    const devharness = rules.find((rule) => rule.packageId === '@sys/ui-dev');
    expect(devharness).to.eql(undefined);

    const components = rules.find((rule) => rule.packageId === '@sys/ui-components');
    expect(components).to.eql(undefined);
  });
});
