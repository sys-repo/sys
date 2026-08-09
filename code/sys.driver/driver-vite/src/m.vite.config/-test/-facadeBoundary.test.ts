import { describe, expect, Fs, it, Path, ROOT } from '../../-test.ts';

const DIRECT_DEFINE_CONFIG_IMPORT = /import\s+\{[^}]*\bdefineConfig\b[^}]*\}\s+from\s+['"](?:npm:)?vite['"]/;
const SYS_JSR_IMPORT = /^\s*import\b(?:[^;]*?\bfrom\s+)?['"](jsr:@sys\/[^'"]+)['"][^;]*;/gm;
const PINNED_DRIVER_VITE_JSR = /^jsr:@sys\/driver-vite@\d+\.\d+\.\d+$/;

const rawDefineConfigExpectedIn: string[] = [];
const publishedJsrExpectedIn: readonly string[] = [
  'code/sys.driver/driver-vite/src/-test/vite.sample-published-baseline/vite.config.ts',
  'code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-baseline/vite.config.ts',
  'code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-components/vite.config.ts',
];

describe('Vite config facade ownership boundary', () => {
  it('uses local facade authority except in pinned published fixtures', async () => {
    const found = await inspectViteConfigs();

    expect(found.rawDefineConfig).to.eql(rawDefineConfigExpectedIn);
    expect(found.sysJsr.map(({ path }) => path)).to.eql(publishedJsrExpectedIn);
    found.sysJsr.forEach(({ specifier }) => expect(specifier).to.match(PINNED_DRIVER_VITE_JSR));
  });
});

async function inspectViteConfigs() {
  const rawDefineConfig: string[] = [];
  const sysJsr: { path: string; specifier: string }[] = [];

  for (const root of ['code', 'deploy'].map((path) => ROOT.resolve(path))) {
    for await (const entry of Fs.walk(root, { includeDirs: false })) {
      if (!isViteConfig(entry.path)) continue;
      if (isIgnoredPath(entry.path)) continue;

      const path = relativeToRoot(entry.path);
      const text = (await Fs.readText(entry.path)).data ?? '';
      if (DIRECT_DEFINE_CONFIG_IMPORT.test(text)) rawDefineConfig.push(path);
      for (const match of text.matchAll(SYS_JSR_IMPORT)) {
        sysJsr.push({ path, specifier: match[1] ?? '' });
      }
    }
  }

  return {
    rawDefineConfig: rawDefineConfig.sort(),
    sysJsr: sysJsr.sort((a, b) => a.path.localeCompare(b.path)),
  };
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
