import { describe, expect, Fs, it, Path, ROOT } from '../../-test.ts';

const DIRECT_DEFINE_CONFIG_IMPORT = /import\s+\{[^}]*\bdefineConfig\b[^}]*\}\s+from\s+['"](?:npm:)?vite['"]/;

const rawDefineConfigExpectedIn: string[] = [];

describe('Vite config facade ownership boundary', () => {
  it('routes live vite.config.ts files through @sys/driver-vite', async () => {
    const found = await findRawDefineConfigImportsInViteConfigs();
    expect(found).to.eql(rawDefineConfigExpectedIn);
  });
});

async function findRawDefineConfigImportsInViteConfigs() {
  const found: string[] = [];

  for (const root of ['code', 'deploy'].map((path) => ROOT.resolve(path))) {
    for await (const entry of Fs.walk(root, { includeDirs: false })) {
      if (!isViteConfig(entry.path)) continue;
      if (isIgnoredPath(entry.path)) continue;

      const text = (await Fs.readText(entry.path)).data ?? '';
      if (DIRECT_DEFINE_CONFIG_IMPORT.test(text)) found.push(relativeToRoot(entry.path));
    }
  }

  return found.sort();
}

function isViteConfig(path: string) {
  return path.replaceAll('\\', '/').endsWith('/vite.config.ts');
}

function isIgnoredPath(path: string) {
  const normalized = path.replaceAll('\\', '/');
  return normalized.includes('/node_modules/') ||
    normalized.includes('/dist/') ||
    normalized.includes('/.tmp/') ||
    normalized.includes('/.cache/');
}

function relativeToRoot(path: string) {
  return Path.relative(ROOT.dir, path).replaceAll('\\', '/');
}
