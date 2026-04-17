import { describe, expect, Fs, Is, Path, ROOT, it } from '../../../-test.ts';
import { DEFAULT_PACKAGE_RULES } from '../u.rules.ts';

describe('OptimizeImportsPlugin.DEFAULT_PACKAGE_RULES', () => {
  it('targets real public subpaths that export the approved symbols', async () => {
    for (const pkgRule of DEFAULT_PACKAGE_RULES) {
      const pkgDir = packageDir(pkgRule.packageId);
      const denoJson = (await Fs.readJson<{ exports?: Record<string, string> }>(Path.join(pkgDir, 'deno.json'))).data;
      const exports = denoJson?.exports ?? {};

      for (const rule of pkgRule.imports) {
        const relativeTarget = exports[rule.subpath];
        expect(Is.string(relativeTarget)).to.eql(true);
        if (!Is.string(relativeTarget)) throw new Error(`Missing export ${rule.subpath} for ${pkgRule.packageId}`);

        const moduleText = (await Fs.readText(Path.join(pkgDir, relativeTarget))).data ?? '';
        expect(exportsSymbol(moduleText, rule.importName)).to.eql(true);
      }
    }
  });
});

function packageDir(packageId: string) {
  if (packageId === '@sys/ui-react-devharness') return ROOT.resolve('code/sys.ui/ui-react-devharness');
  if (packageId === '@sys/ui-react-components') return ROOT.resolve('code/sys.ui/ui-react-components');
  throw new Error(`Unsupported package rule test mapping: ${packageId}`);
}

function exportsSymbol(moduleText: string, symbol: string) {
  const patterns = [
    new RegExp(`export\\s*\\{[^}]*\\b${escapeRegExp(symbol)}\\b`, 'm'),
    new RegExp(`export\\s+(?:const|class|function|let|var|type|interface|enum)\\s+${escapeRegExp(symbol)}\\b`, 'm'),
  ];
  return patterns.some((pattern) => pattern.test(moduleText));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
