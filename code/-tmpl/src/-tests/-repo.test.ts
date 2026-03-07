import { type t, describe, expect, Fs, it, makeTmpl, Path, Templates } from '../-test.ts';
import { logTemplate, makeWorkspace } from './u.ts';

// Integration test override: point generated temp repos at the current local source modules.
const LOCAL_MONOREPO_CI = toLocalPath('../../../sys/monorepo/src/m.ci/mod.ts');
const LOCAL_DRIVER_DENO_RUNTIME = toLocalPath('../../../sys.driver/driver-deno/src/ns.Runtime/mod.ts');

describe('Template: repo', () => {
  it('run', async () => {
    /**
     * Template setup:
     */
    const test = await makeWorkspace();
    const name: t.TemplateName = 'repo';
    const def = await Templates[name]();
    const tmpl = await makeTmpl(name);

    const targetDir = test.root;

    // Write → init (CLI flow)
    const res = await tmpl.write(targetDir, { force: true });
    await def.default(targetDir);
    logTemplate('repo', res);

    const ls = await test.ls();
    const includes = (endsWith: t.StringPath) => !!ls.find((p) => p.endsWith(endsWith));

    /**
     * Assertions:
     */
    expect(includes('/deno.json')).to.be.true;
    expect(includes('/imports.json')).to.be.true;
    expect(includes('/README.md')).to.be.true;
    expect(includes('/code/projects/mod.ts')).to.be.true;
    expect(includes('/-scripts/task.prep.ts')).to.be.true;
    expect(includes('/-scripts/tmpl.ts')).to.be.true;
    expect(includes('/.github/workflows/ci.yaml')).to.be.false;
    expect(includes('/.tmpl.ts')).to.be.false;
  });
});

describe('Template: repo integration', () => {
  it('generate in temp dir → deno task ci passes', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.ci-' });
    const root = tmp.absolute;

    const def = await Templates.repo();
    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await def.default(root);
    await rewriteMonorepoImport(root);

    const cmd = new Deno.Command('deno', {
      args: ['task', 'ci'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    });
    const res = await cmd.output();
    const out = new TextDecoder().decode(res.stdout);
    const err = new TextDecoder().decode(res.stderr);

    if (!res.success) {
      throw new Error(`Generated repo CI failed (code ${res.code}).\n\nstdout:\n${out}\n\nstderr:\n${err}`);
    }
  });

  it('generate in temp dir → deno task prep materializes project workflows', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.prep-' });
    const root = tmp.absolute;

    const def = await Templates.repo();
    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await def.default(root);
    await rewriteMonorepoImport(root);

    const projectDir = Fs.join(root, 'code/projects/demo');
    await Fs.writeJson(Fs.join(projectDir, 'deno.json'), {
      tasks: { build: 'deno task help', test: 'deno task help' },
    });

    const cmd = new Deno.Command('deno', {
      args: ['task', 'prep'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    });
    const res = await cmd.output();
    const out = new TextDecoder().decode(res.stdout);
    const err = new TextDecoder().decode(res.stderr);

    if (!res.success) {
      throw new Error(`Generated repo prep failed (code ${res.code}).\n\nstdout:\n${out}\n\nstderr:\n${err}`);
    }

    const build = (await Fs.readText(Fs.join(root, '.github/workflows/build.yaml'))).data ?? '';
    const test = (await Fs.readText(Fs.join(root, '.github/workflows/test.yaml'))).data ?? '';
    expect(build.includes('name: "code/projects/demo"')).to.eql(true);
    expect(test.includes('name: "code/projects/demo"')).to.eql(true);
  });
});

async function rewriteMonorepoImport(root: string) {
  const path = Fs.join(root, 'imports.json');
  const json = (await Fs.readJson(path)).data as { imports?: Record<string, string> };
  json.imports ??= {};
  json.imports['@sys/monorepo/ci'] = LOCAL_MONOREPO_CI;
  json.imports['@sys/driver-deno/runtime'] = LOCAL_DRIVER_DENO_RUNTIME;
  await Fs.writeJson(path, json);
}

function toLocalPath(relativePath: string) {
  return Path.fromFileUrl(new URL(relativePath, import.meta.url));
}
