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
    expect(Is.object(components)).to.eql(true);
    if (!components) throw new Error('Expected @sys/ui-react-components rule set');

    const expected = [
      ['Button', './button'],
      ['Cropmarks', './cropmarks'],
      ['Icon', './icon'],
      ['ObjectView', './object-view'],
      ['KeyValue', './key-value'],
      ['Spinners', './spinners'],
      ['CenterColumn', './layout/center-column'],
      ['IFrame', './iframe'],
      ['Player', './player'],
      ['SplitPane', './layout/split-pane'],
      ['TreeView', './tree-view'],
      ['Media', './media'],
    ] as const;

    for (const [importName, subpath] of expected) {
      expect(components.imports.some((rule) => rule.importName === importName && rule.subpath === subpath)).to.eql(true);
    }
  });
});
