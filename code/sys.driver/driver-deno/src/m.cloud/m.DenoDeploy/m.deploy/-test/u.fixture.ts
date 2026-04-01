import { Fs } from '../../../../-test.ts';
import { D } from '../../common.ts';

/**
 * Creates a fake native `deno deploy` CLI boundary for standalone deploy tests.
 *
 * The fixture records the invocation shape and verifies that `prepare()`
 * wrote the staged deploy config and compat entrypoint before `deploy()`
 * shells out to the native CLI.
 */
export async function createFakeDeployCli(stageRoot: string) {
  const dir = await Fs.makeTempDir({ prefix: 'driver-deno.deploy.fake-cli-' });
  const cli = Fs.join(dir.absolute, 'deno');
  const invocationPath = Fs.join(dir.absolute, 'invocation.json');
  const preparedPath = Fs.join(dir.absolute, 'prepared.json');
  const recordScript = Fs.join(dir.absolute, 'record-invocation.ts');
  const assertScript = Fs.join(dir.absolute, 'assert-prepared-stage.ts');
  const realDeno = Deno.execPath();
  const configPath = Fs.join(stageRoot, 'deno.json');
  const compatEntrypoint = Fs.join(stageRoot, '-staged', 'm.server.ts');

  await Fs.write(recordScript, recordInvocationScript());
  await Fs.write(assertScript, assertPreparedStageScript());

  await Fs.write(
    cli,
    [
      '#!/bin/sh',
      'set -eu',
      `"${realDeno}" run -A "${recordScript}" "${invocationPath}" "$@"`,
      `"${realDeno}" run -A "${assertScript}" "${configPath}" "${compatEntrypoint}" "${preparedPath}"`,
      'echo "Revision available at https://console.deno.com/projects/my-app/deployments/abc"',
      'echo "Preview available at https://my-app-abc.deno.net"',
    ].join('\n'),
  );
  await Deno.chmod(cli, 0o755);

  return {
    cli,
    invocationPath,
    preparedPath,
  } as const;
}

function recordInvocationScript() {
  return [
    'const [out, ...args] = Deno.args;',
    'await Deno.writeTextFile(out, JSON.stringify({ cwd: Deno.cwd(), args }, null, 2));',
  ].join('\n');
}

function assertPreparedStageScript() {
  return [
    'const [configPath, compatPath, out] = Deno.args;',
    'const config = JSON.parse(await Deno.readTextFile(configPath));',
    "if (config.deploy?.entrypoint !== './entry.ts' || config.deploy?.cwd !== './') {",
    "  throw new Error('standalone prepare did not write deploy config');",
    '}',
    'const compat = await Deno.readTextFile(compatPath);',
    'await Deno.writeTextFile(out, JSON.stringify({ deploy: config.deploy, compatEntrypoint: compat }, null, 2));',
  ].join('\n');
}
