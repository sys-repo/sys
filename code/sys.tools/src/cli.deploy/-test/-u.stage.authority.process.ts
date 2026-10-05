import { Deploy } from '../mod.ts';
import { Err, Fs, Json, Obj, type t } from '../common.ts';

type Mode = 'restricted' | 'home' | 'home-missing' | 'env-tilde';

const [cwdRaw, modeRaw] = Deno.args;
if (!cwdRaw) throw new Error('Expected fixture cwd.');
if (
  modeRaw !== 'restricted' &&
  modeRaw !== 'home' &&
  modeRaw !== 'home-missing' &&
  modeRaw !== 'env-tilde'
) {
  throw new Error(`Unsupported authority mode: ${String(modeRaw)}`);
}

const cwd = cwdRaw as t.StringDir;
const mode: Mode = modeRaw;
const permissions = await permissionReport();
const result = await run(mode, cwd);
console.info(Json.stringify({ mode, permissions, result }));

async function run(mode: Mode, cwd: t.StringDir) {
  switch (mode) {
    case 'restricted': {
      assertEnvValues(permissions.envValues, []);
      assertState(permissions.home, 'denied', 'HOME');
      assertState(permissions.sourceRoot, 'denied', 'DEPLOY_SOURCE_ROOT');
      assertDeniedRuntimePermissions(permissions);

      const plain = await Deploy.stage({ cwd, config: configPath('authority') });
      const literal = await Deploy.stage({ cwd, config: configPath('literal-user') });
      const sourceTildeError = await failureOf(cwd, 'source-tilde', 'HOME authority is required');
      const stagingTildeError = await failureOf(
        cwd,
        'staging-tilde',
        'staging.dir must be relative: ~/output',
      );
      const stagingUserTildeError = await failureOf(
        cwd,
        'staging-user-tilde',
        'staging.dir must be relative: ~user/output',
      );
      const mappingStagingTildeError = await failureOf(
        cwd,
        'mapping-staging-tilde',
        "mappings[0].dir.staging must be relative (or '.'): ~/output",
      );
      const mappingStagingUserTildeError = await failureOf(
        cwd,
        'mapping-staging-user-tilde',
        "mappings[0].dir.staging must be relative (or '.'): ~user/output",
      );

      return {
        plain: plain.ok && await Fs.exists(`${cwd}/.tmp/authority/index.html`),
        literal: literal.ok && await Fs.exists(`${cwd}/.tmp/literal/index.html`),
        sourceTildeError,
        stagingTildeError,
        stagingUserTildeError,
        mappingStagingTildeError,
        mappingStagingUserTildeError,
      };
    }
    case 'home': {
      assertEnvValues(permissions.envValues, ['HOME']);
      assertState(permissions.home, 'granted', 'HOME');
      assertState(permissions.sourceRoot, 'denied', 'DEPLOY_SOURCE_ROOT');
      assertDeniedRuntimePermissions(permissions);

      const staged = await Deploy.stage({ cwd, config: configPath('source-tilde') });
      return { staged: staged.ok && await Fs.exists(`${cwd}/.tmp/home/index.html`) };
    }
    case 'home-missing': {
      assertEnvValues(permissions.envValues, ['HOME']);
      assertState(permissions.home, 'granted', 'HOME');
      assertState(permissions.sourceRoot, 'denied', 'DEPLOY_SOURCE_ROOT');
      assertDeniedRuntimePermissions(permissions);

      const error = await failureOf(cwd, 'source-tilde', 'HOME value is required');
      return { error };
    }
    case 'env-tilde': {
      assertEnvValues(permissions.envValues, ['DEPLOY_SOURCE_ROOT']);
      assertState(permissions.home, 'denied', 'HOME');
      assertState(permissions.sourceRoot, 'granted', 'DEPLOY_SOURCE_ROOT');
      assertDeniedRuntimePermissions(permissions);

      const error = await failureOf(cwd, 'env-tilde', 'HOME authority is required');
      return { error };
    }
  }
}

function configPath(name: string): t.StringPath {
  return `./-config/@sys.tools.deploy/${name}.yaml`;
}

async function failureOf(cwd: t.StringDir, name: string, expected: string): Promise<string> {
  try {
    await Deploy.stage({ cwd, config: configPath(name) });
  } catch (error) {
    const summary = Err.summary(error, { cause: true, stack: false });
    if (!summary.includes(expected)) {
      throw new Error(`Expected failure containing "${expected}".\n${summary}`);
    }
    return expected;
  }
  throw new Error(`Expected ${name} staging to fail.`);
}

async function permissionReport() {
  const state = async (descriptor: Deno.PermissionDescriptor) =>
    (await Deno.permissions.query(descriptor)).state;

  return {
    env: await state({ name: 'env' }),
    envValues: Obj.keys(Deno.env.toObject()).map(String).sort(),
    home: await state({ name: 'env', variable: 'HOME' }),
    sourceRoot: await state({ name: 'env', variable: 'DEPLOY_SOURCE_ROOT' }),
    net: await state({ name: 'net' }),
    run: await state({ name: 'run' }),
    sys: await state({ name: 'sys' }),
    ffi: await state({ name: 'ffi' }),
  } as const;
}

function assertEnvValues(actual: t.Ary<string>, expected: t.Ary<string>): void {
  if (actual.join(',') !== expected.join(',')) {
    throw new Error(`Expected visible env keys [${expected}], received [${actual}].`);
  }
}

function assertDeniedRuntimePermissions(
  permissions: Awaited<ReturnType<typeof permissionReport>>,
): void {
  assertState(permissions.env, 'denied', 'env');
  assertState(permissions.net, 'denied', 'net');
  assertState(permissions.run, 'denied', 'run');
  assertState(permissions.sys, 'denied', 'sys');
  assertState(permissions.ffi, 'denied', 'ffi');
}

function assertState(
  actual: Deno.PermissionState,
  expected: Deno.PermissionState,
  label: string,
): void {
  if (actual !== expected) {
    throw new Error(`Expected ${label} permission ${expected}, received ${actual}.`);
  }
}
