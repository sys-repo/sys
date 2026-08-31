import { Fs, Is, Json, Path, Str, type t } from '../common.ts';
import { withTmpDir } from './u.fixture.ts';

const CHILD = Path.fromFileUrl(
  new URL('./-u.stage.authority.process.ts', import.meta.url),
) as t.StringAbsolutePath;
const decoder = new TextDecoder();

type Mode = 'restricted' | 'home' | 'home-missing' | 'env-tilde';
type ChildReport = Readonly<{
  mode: Mode;
  permissions: {
    readonly env: Deno.PermissionState;
    readonly envValues: readonly string[];
    readonly home: Deno.PermissionState;
    readonly sourceRoot: Deno.PermissionState;
    readonly net: Deno.PermissionState;
    readonly run: Deno.PermissionState;
    readonly sys: Deno.PermissionState;
    readonly ffi: Deno.PermissionState;
  };
  result: Record<string, string | boolean>;
}>;

await withTmpDir(async (cwd) => {
  await writeAuthorityFixtures(cwd);

  const restricted = await runChild(cwd, 'restricted', [
    '--ignore-env',
    '--deny-env=HOME,DEPLOY_SOURCE_ROOT',
  ]);
  assertJsonEquals(restricted, {
    mode: 'restricted',
    permissions: {
      env: 'denied',
      envValues: [],
      home: 'denied',
      sourceRoot: 'denied',
      net: 'denied',
      run: 'denied',
      sys: 'denied',
      ffi: 'denied',
    },
    result: {
      plain: true,
      literal: true,
      sourceTildeError: 'HOME authority is required',
      stagingTildeError: "staging.dir must be relative (or '.'): ~/output",
      mappingStagingTildeError: "mappings[0].dir.staging must be relative (or '.'): ~/output",
    },
  });

  const home = await runChild(
    cwd,
    'home',
    [
      '--ignore-env',
      '--allow-env=HOME',
      '--deny-env=DEPLOY_SOURCE_ROOT',
    ],
    { HOME: cwd },
  );
  assertJsonEquals(home, {
    mode: 'home',
    permissions: {
      env: 'denied',
      envValues: ['HOME'],
      home: 'granted',
      sourceRoot: 'denied',
      net: 'denied',
      run: 'denied',
      sys: 'denied',
      ffi: 'denied',
    },
    result: { staged: true },
  });

  const homeMissing = await runChild(
    cwd,
    'home-missing',
    ['--ignore-env', '--allow-env=HOME', '--deny-env=DEPLOY_SOURCE_ROOT'],
    { HOME: '' },
  );
  assertJsonEquals(homeMissing, {
    mode: 'home-missing',
    permissions: {
      env: 'denied',
      envValues: ['HOME'],
      home: 'granted',
      sourceRoot: 'denied',
      net: 'denied',
      run: 'denied',
      sys: 'denied',
      ffi: 'denied',
    },
    result: { error: 'HOME value is required' },
  });

  const envTilde = await runChild(
    cwd,
    'env-tilde',
    [
      '--ignore-env',
      '--allow-env=DEPLOY_SOURCE_ROOT',
      '--deny-env=HOME',
    ],
    { DEPLOY_SOURCE_ROOT: '~' },
  );
  assertJsonEquals(envTilde, {
    mode: 'env-tilde',
    permissions: {
      env: 'denied',
      envValues: ['DEPLOY_SOURCE_ROOT'],
      home: 'denied',
      sourceRoot: 'granted',
      net: 'denied',
      run: 'denied',
      sys: 'denied',
      ffi: 'denied',
    },
    result: { error: 'HOME authority is required' },
  });
});

console.info('Deploy.stage authority proof passed.');

async function runChild(
  cwd: t.StringDir,
  mode: Mode,
  envPermissions: t.Ary<string>,
  env: Record<string, string> = {},
): Promise<ChildReport> {
  const args = [
    'run',
    '--check',
    '--quiet',
    '--frozen',
    '--cached-only',
    '--no-prompt',
    `--allow-read=${cwd}`,
    `--allow-write=${cwd}/.tmp`,
    ...envPermissions,
    '--deny-net',
    '--deny-run',
    '--deny-sys',
    '--deny-ffi',
    CHILD,
    cwd,
    mode,
    '--no-color',
  ];
  assertJsonEquals(args.filter((value) => value.startsWith('--allow-')), [
    `--allow-read=${cwd}`,
    `--allow-write=${cwd}/.tmp`,
    ...envPermissions.filter((value) => value.startsWith('--allow-')),
  ]);
  if (mode === 'restricted') {
    assertJsonEquals(envPermissions.filter((value) => value.startsWith('--allow-env')), []);
  }

  const output = await new Deno.Command(Deno.execPath(), {
    args,
    cwd: Fs.cwd(),
    env,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stderr = decoder.decode(output.stderr);
  if (!output.success || output.code !== 0 || stderr !== '') {
    throw new Error(`Authority child failed (${output.code}).\n${stderr}`);
  }

  const report = Json.parse<ChildReport>(decoder.decode(output.stdout));
  if (!Is.object(report)) throw new Error('Authority child returned invalid JSON.');
  return report;
}

function assertJsonEquals(actual: unknown, expected: unknown): void {
  const actualJson = Json.stringify(actual);
  const expectedJson = Json.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `Authority assertion failed.\nactual: ${actualJson}\nexpected: ${expectedJson}`,
    );
  }
}

async function writeAuthorityFixtures(cwd: t.StringDir): Promise<void> {
  const configs = `${cwd}/-config/@sys.tools.deploy`;
  await Fs.ensureDir(configs);
  await Fs.ensureDir(`${cwd}/input/site`);
  await Fs.ensureDir(`${cwd}/~user/site`);
  await Fs.write(`${cwd}/input/site/index.html`, '<html>authority</html>\n');
  await Fs.write(`${cwd}/~user/site/index.html`, '<html>literal-user</html>\n');

  await Fs.write(`${configs}/authority.yaml`, endpointYaml('.', 'input/site', './.tmp/authority'));
  await Fs.write(
    `${configs}/literal-user.yaml`,
    endpointYaml('.', '~user/site', './.tmp/literal'),
  );
  await Fs.write(`${configs}/source-tilde.yaml`, endpointYaml('~', 'input/site', './.tmp/home'));
  await Fs.write(
    `${configs}/env-tilde.yaml`,
    endpointYaml('${env:DEPLOY_SOURCE_ROOT}', 'input/site', './.tmp/env-tilde'),
  );
  await Fs.write(`${configs}/staging-tilde.yaml`, endpointYaml('.', 'input/site', '~/output'));
  await Fs.write(
    `${configs}/mapping-staging-tilde.yaml`,
    endpointYaml('.', 'input/site', './.tmp/mapping-tilde', '~/output'),
  );
}

function endpointYaml(
  sourceRoot: string,
  source: string,
  stagingRoot: string,
  mappingStaging = '.',
): string {
  return Str.dedent(`
    source:
      dir: '${sourceRoot}'
    staging:
      dir: '${stagingRoot}'
      clear: true
    mappings:
      - mode: copy
        dir:
          source: '${source}'
          staging: '${mappingStaging}'
  `);
}
