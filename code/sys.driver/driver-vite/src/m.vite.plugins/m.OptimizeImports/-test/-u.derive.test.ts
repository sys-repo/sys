import { describe, expect, Is, ROOT, it } from '../../../-test.ts';
import { workspace } from '../../../m.vite.config.workspace/mod.ts';
import { deriveWorkspacePackageRules } from '../u.derive.ts';

describe('OptimizeImportsPlugin.deriveWorkspacePackageRules', () => {
  it('derives safe public narrow-import rules from workspace exports and barrels', async () => {
    const ws = await workspace({ denofile: ROOT.denofile.path, walkup: false });
    const rules = await deriveWorkspacePackageRules(ws);

    const devharness = rules.find((rule) => rule.packageId === '@sys/ui-react-devharness');
    expect(Is.object(devharness)).to.eql(true);
    if (!devharness) throw new Error('Expected @sys/ui-react-devharness rule set');

    expect(devharness.imports.some((rule) => rule.importName === 'useKeyboard' && rule.subpath === './hooks')).to.eql(true);
    expect(devharness.imports.some((rule) => rule.importName === 'useRubberband')).to.eql(false);

    const components = rules.find((rule) => rule.packageId === '@sys/ui-react-components');
    expect(components).to.eql(undefined);
  });
});
