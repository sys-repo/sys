import { describe, expect, Fs, it, type t } from '../../-test.ts';
import { TmplTesting } from '../mod.ts';
import { readAuthorityFiles, writeRepo } from './u.fixture.ts';

describe('m.testing/LocalRepoAuthorities', () => {
  it('read → reads generated repo imports.json and package.json', async () => {
    const root = await writeRepo();
    const authorities = await TmplTesting.LocalRepoAuthorities.read(root);
    const files = await readAuthorityFiles(root);

    expect(authorities.imports).to.eql(files.imports.imports);
    expect(authorities.packageJson).to.eql(files.packageJson);
  });

  it('rewrite → discovers exact npm subpaths from member inputs, not local artifacts', async () => {
    const { absolute: root } = await Fs.makeTempDir({ prefix: 'tmpl.authority-inputs-' });
    const cases = [
      { name: 'with-script', script: true },
      { name: 'without-script', script: false },
    ];
    try {
      // Separate roots rule out reuse of either cached authorities or an earlier import map.
      for (const { name, script } of cases) {
        const caseRoot = Fs.join(root, name);
        const { target, workspaceRoot, entry } = await writeDiscoveryFixture(caseRoot, { script });
        await TmplTesting.LocalRepoAuthorities.rewrite({ root: target, workspaceRoot });
        const { imports } = (await readAuthorityFiles(target)).imports;

        expect(imports, name).to.include({
          '@sys/probe': entry,
          'probe-dep/exported': 'npm:probe-dep@1.2.3/exported',
          'probe-dep/extension': 'npm:probe-dep@1.2.3/extension',
        });
        expect(imports['probe-dep/kept'], name).to.eql(
          script ? 'npm:probe-dep@1.2.3/kept' : undefined,
        );
        for (const specifier of ['probe-dep/scratch', 'probe-dep/runtime', 'probe-dep/installed']) {
          expect(imports, name).not.to.have.property(specifier);
        }
      }
    } finally {
      await Fs.remove(root);
    }
  });
});

async function writeDiscoveryFixture(root: t.StringAbsoluteDir, options: { script: boolean }) {
  const workspaceRoot = Fs.join(root, 'workspace');
  const target = Fs.join(root, 'target');
  const member = Fs.join(workspaceRoot, 'probe');
  const exported = './dist/mod.js';
  const write = { throw: true };

  const manifest = { name: '@sys/probe', version: '0.0.0', exports: { '.': exported } };
  const pkg = { dependencies: { 'probe-dep': '1.2.3' } };
  await Fs.writeJson(Fs.join(workspaceRoot, 'deno.json'), { workspace: ['./probe'] }, write);
  await Fs.writeJson(Fs.join(member, 'deno.json'), manifest, write);
  await Fs.writeJson(Fs.join(workspaceRoot, 'package.json'), pkg, write);
  await Fs.writeJson(Fs.join(target, 'package.json'), {}, write);
  for (const dir of [workspaceRoot, target]) {
    await Fs.writeJson(Fs.join(dir, 'imports.json'), { imports: {} }, write);
  }

  const imports = [
    [exported, 'probe-dep/exported'],
    ['.pi/@sys/extensions/demo.ts', 'probe-dep/extension'],
    ['.tmp/run/demo.ts', 'probe-dep/scratch'],
    ['.pi/@sys/tmp/demo.ts', 'probe-dep/runtime'],
    ['node_modules/.vite/deps/demo.js', 'probe-dep/installed'],
  ];
  if (options.script) imports.push(['-scripts/kept.ts', 'probe-dep/kept']);
  for (const [path, specifier] of imports) {
    await Fs.write(Fs.join(member, path), `import '${specifier}';\n`, write);
  }
  return { target, workspaceRoot, entry: Fs.join(member, exported) } as const;
}
