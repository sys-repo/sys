import { Fs, Str, Testing, Workspace } from '../../../../-test.ts';

export async function createNoBuildWorkspace() {
  const fs = await Testing.dir('DenoDeploy.pipeline.autoCreate');
  await Fs.writeJson(fs.join('deno.json'), {
    name: 'root',
    version: '0.0.0',
    workspace: ['./code/apps/foo'],
  });
  await Fs.writeJson(fs.join('code/apps/foo/deno.json'), {
    name: '@test/foo',
    version: '0.0.0',
    exports: { '.': './src/mod.ts' },
  });
  await Fs.write(
    fs.join('code/apps/foo/src/mod.ts'),
    `export default { fetch() { return new Response('ok'); } };\n`,
  );
  await Workspace.Prep.Graph.write({
    cwd: fs.dir,
    snapshot: Workspace.Graph.Snapshot.create({
      graph: {
        orderedPaths: ['code/apps/foo'],
        edges: [],
      },
    }),
  });
  return fs;
}

export async function createFakeAutoCreateDeployCli() {
  const dir = await Fs.makeTempDir({ prefix: 'driver-deno.pipeline.auto-create-' });
  const cli = Fs.join(dir.absolute, 'deno');
  const callsPath = Fs.join(dir.absolute, 'calls.json');
  const statePath = Fs.join(dir.absolute, 'state.json');
  const script = Fs.join(dir.absolute, 'fake-cli.ts');
  const realDeno = Deno.execPath();

  await Fs.write(
    script,
    Str.dedent(`
      const [callsPath, statePath, ...args] = Deno.args;
      const state = JSON.parse(await Deno.readTextFile(statePath).catch(() => '{"created":false,"calls":[]}'));
      const cmd = args[0] === 'deploy' && args[1] === 'create'
        ? 'create'
        : args[0] === 'deploy'
        ? 'deploy'
        : 'other';
      state.calls.push(cmd);
      await Deno.writeTextFile(statePath, JSON.stringify(state, null, 2));
      await Deno.writeTextFile(callsPath, JSON.stringify({ calls: state.calls }, null, 2));

      if (cmd === 'create') {
        state.created = true;
        await Deno.writeTextFile(statePath, JSON.stringify(state, null, 2));
        Deno.exit(0);
      }

      if (cmd === 'deploy' && state.created !== true) {
        console.error('✗ An error occurred:');
        console.error('  The requested app was not found, or you do not have access to view it.');
        Deno.exit(1);
      }

      if (cmd === 'deploy') {
        console.log('Revision available at https://console.deno.com/projects/sample-proxy/deployments/created');
        console.log('Preview available at https://sample-proxy-created.deno.net');
        Deno.exit(0);
      }

      Deno.exit(1);
    `),
  );

  await Fs.write(
    cli,
    Str.dedent(`
      # Fake \`deno\` CLI shim: record deploy/create calls and simulate missing-app -> create -> redeploy.
      #!/bin/sh
      set -eu
      "${realDeno}" run -A "${script}" "${callsPath}" "${statePath}" "$@"
    `),
  );
  await Deno.chmod(cli, 0o755);

  return { cli, callsPath } as const;
}
