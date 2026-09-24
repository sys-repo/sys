import { Path } from '@sys/std/path';
import { Raw } from '../../src/m.cli/m.raw/mod.ts';
import { resolveRun } from '../../src/m.cli/m.profiles/u/u.resolve.run.ts';
import { withInherit } from '../../src/m.cli/u/u.inherit.ts';
import { PiSandboxReport } from '../../src/m.cli/u/u.report.sandbox.ts';
import { PiArgs } from '../../src/m.cli/u/u.args.ts';
import { resolvePkg } from '../../src/m.cli/u/u.resolve.pkg.ts';
import { describe, Err, expect, Fs, Is, it, Json, Obj, Process, Str, type t } from '../common.ts';
import {
  expectCompleteExit,
  HOST_DENIED,
  isolateHostArgs,
  reportHostOutput,
  requireAdmittedHost,
  selectHost,
} from './u.host.compat.ts';

const PREFIX = 'SYS_REPORT_HOST ';
const SECRET = 'REPORT_HOST_SECRET_SENTINEL';
const SHUTDOWN = 'SYS_REPORT_HOST_SHUTDOWN ';
const TEMP_ENV = ['TMPDIR', 'TMP', 'TEMP'] as const;

/** One real-host capstone; the unit suites own the input and rendering permutations. */
describe('Pi: launcher reporting host', () => {
  it('admitted release → isolated npm CLI assembles inputs, loads tools, and shuts down', async () => {
    const cwd = Fs.resolve(import.meta.dirname ?? '.', '../..');
    const selection = selectHost(Deno.args, await resolvePkg({ cwd }));
    const { pkg, version } = selection;
    const admitted = await requireAdmittedHost(pkg, version);
    console.info(
      Json.stringify({ pi: admitted.artifact, deno: Deno.version, platform: Deno.build }),
    );
    await using fixture = await createHostFixture();
    const { root } = fixture;
    await Fs.copy(admitted.paths.cache, PiArgs.toDenoDir(root), { throw: true });
    await Fs.copyFile(admitted.paths.config, Fs.join(root, 'deno.json'), { throw: true });
    await Fs.copyFile(admitted.paths.lock, Fs.join(root, 'deno.lock'), { throw: true });
    const config = Fs.join(root, 'profile.yaml');
    const extension = Fs.join(root, 'observe.ts');

    // Only fixture-owned inputs enter this host; no user prompt or RPC request is submitted.
    await Fs.write(
      config,
      Json.stringify({
        tools: { zip: { enabled: false }, ocr: { pdf: { enabled: false } } },
        sandbox: { context: { append: ['./extra.md'] } },
      }),
      { throw: true },
    );
    for (const name of ['SYSTEM', 'AGENTS', 'extra']) {
      await Fs.write(Fs.join(root, `${name}.md`), `${SECRET}_${name}`, { throw: true });
    }
    const outside = [
      Fs.join(Fs.dirname(root), `${Fs.basename(root)}.canary`),
      admitted.paths.root,
      admitted.paths.receipt,
    ];
    await Fs.write(extension, observerSource(config, outside), { throw: true });

    const resolved = await resolveRun({
      cwd: { invoked: root, root },
      config,
      ...(selection.explicit ? { pkg } : {}),
      args: ['--mode', 'rpc', '--no-session', '--offline'],
      env: { TMPDIR: fixture.tmp, TMP: fixture.tmp, TEMP: fixture.tmp, PI_OFFLINE: '1' },
    });
    expect(resolved.pkg).to.eql(pkg);
    for (const scope of [resolved.sandbox.read, resolved.sandbox.write]) {
      expect(scope?.detail, 'profile resolution uses the owned temp root').to.include(fixture.tmp);
      expect(scope?.detail, 'profile resolution excludes shared temporary state').not.to.include(
        Fs.dirname(root),
      );
    }
    expect(resolved.sandbox.launch?.contributions).to.eql([
      'system prompt: default',
      `system file: ${Fs.join(root, 'SYSTEM.md')}`,
      `context file: ${Fs.join(root, 'AGENTS.md')}`,
      `context file: ${Fs.join(root, 'extra.md')}`,
      'filesystem tool contract',
      'runtime metadata',
      'final provenance safety',
    ]);

    const reportPath = await PiSandboxReport.write({ cwd: root, sandbox: resolved.sandbox });
    const report = await Fs.readText(reportPath);
    expect(report.ok, 'persisted report is readable').to.eql(true);
    expect(report.data).not.to.contain(SECRET);
    expect(report.data).to.contain('- observation: launch-input');
    expect(report.data).to.contain(`- upstream selection: ${pkg}`);

    const output = await fixture.capture({
      ...resolved,
      args: [...resolved.args, '--extension', extension],
    });
    const extensions = resolved.args.flatMap((arg, i) =>
      arg === '--extension' ? [resolved.args[i + 1]] : []
    );
    expect(extensions, 'only the generated filesystem extension is enabled').to.have.length(1);
    expectHostAssembly(output, config, extensions[0], outside);
  });

  it('fixture scope → restores the parent temp environment after success and failure', async () => {
    const before = TEMP_ENV.map((key) => Deno.env.get(key));
    const failure = new Error('fixture body failed');
    const run = async (fail: boolean) => {
      await using fixture = await createHostFixture();
      expect(TEMP_ENV.map((key) => Deno.env.get(key))).to.eql(TEMP_ENV.map(() => fixture.tmp));
      if (fail) throw failure;
    };
    await run(false);
    expect(TEMP_ENV.map((key) => Deno.env.get(key))).to.eql(before);
    let thrown: unknown;
    try {
      await run(true);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).to.equal(failure);
    expect(TEMP_ENV.map((key) => Deno.env.get(key))).to.eql(before);
  });
});

/** Own the child and its files together: uncertain settlement must retain the fixture. */
async function createHostFixture() {
  const packageRoot = Fs.resolve(import.meta.dirname ?? '.', '../..');
  const parent = Fs.join(packageRoot, '.tmp');
  await Fs.ensureDir(parent);
  const root = (await Fs.makeTempDir({ dir: parent, prefix: 'report-host.' })).absolute;
  const tmp = Fs.join(root, 'tmp');
  await Fs.ensureDir(tmp);
  let unsettled = false;

  // Both resolveRun and Raw.run read parent temp variables while assembling authority.
  // This single-host test owns that process-local scope for the fixture's entire lifetime.
  const previous = TEMP_ENV.map((key) => ({ key, value: Deno.env.get(key) }));
  for (const { key } of previous) Deno.env.set(key, tmp);

  return {
    root,
    tmp,
    async capture(input: t.PiCli.RunArgs): Promise<t.Process.CaptureOutput> {
      const captures: t.Process.CaptureOutput[] = [];
      await withInherit(async (request) => {
        expect(request.cmd, 'preserve the Deno subprocess boundary').to.eql('deno');
        for (const key of ['DENO_DIR', 'HOME', 'PI_CODING_AGENT_DIR', ...TEMP_ENV]) {
          expect(Path.Is.within(root, request.env?.[key]), `${key} must be fixture-owned`).to.eql(
            true,
          );
        }
        for (const name of ['read', 'write']) {
          const prefix = `--allow-${name}=`;
          const flags = request.args.filter((arg) => arg.startsWith(prefix));
          expect(flags, `one scoped ${name} grant`).to.have.length(1);
          const paths = flags[0].slice(prefix.length).split(',');
          expect(paths, `${name} includes owned temp state`).to.include(tmp);
          expect(paths, `${name} excludes the shared temp root`).not.to.include(parent);
          if (name === 'write') {
            expect(paths.every((path) => Path.Is.within(root, path))).to.eql(true);
          }
        }
        const args = isolateHostArgs(request.args, input.pkg!, root);
        unsettled = true;
        const output = await Process.capture({
          ...request,
          cmd: Deno.execPath(),
          args,
          // No ambient keys/proxies/Pi markers; no native run/FFI network escape lanes.
          clearEnv: true,
          executionTimeout: 120_000,
          maxStdoutBytes: 65_536,
          maxStderrBytes: 262_144,
        });
        captures.push(output);
        unsettled = output.outcome === 'failed' ||
          (output.outcome !== 'failed-to-start' && output.status === null);
        reportHostOutput(output);
        expectCompleteExit(output);
        if (output.outcome !== 'exited') throw Err.std(`Host did not exit: ${output.outcome}`);
        return { code: output.code, success: output.success, signal: output.signal };
      }, () => Raw.run(input));
      expect(captures, 'exactly one selected CLI child').to.have.length(1);
      return captures[0];
    },
    async [Symbol.asyncDispose]() {
      // Restore even when uncertain child settlement requires retaining its files.
      for (const { key, value } of previous) {
        if (value === undefined) Deno.env.delete(key);
        else Deno.env.set(key, value);
      }
      if (unsettled) {
        throw Err.std(`Host settlement unconfirmed; fixture retained at ${root}`);
      }
      await Fs.remove(root);
    },
  };
}

/** Admit complete child evidence before interpreting any assembly positions. */
function expectHostAssembly(
  output: t.Process.CaptureOutput,
  profile: string,
  extension: string,
  outside: readonly string[],
) {
  expect(output.success, output.text.stderr).to.eql(true);
  const text = `${output.text.stdout}\n${output.text.stderr}`;
  const lines = text.split('\n').filter((line) => line.startsWith(PREFIX));
  expect(lines, text).to.have.length(1);
  const observed: unknown = Json.parse(lines[0].slice(PREFIX.length));
  if (!Is.record(observed) || !Is.record(observed.positions)) {
    throw Err.std('Missing named host assembly evidence.');
  }

  const order = ['base', 'system', 'agents', 'context', 'filesystem', 'metadata', 'safety'];
  expect(Obj.keys(observed.positions)).to.have.members(order);
  let previous = -1;
  for (const name of order) {
    const position = observed.positions[name];
    if (!Is.num(position)) throw Err.std(`Missing host position: ${name}`);
    expect(position, `${name} must be present and follow its predecessor`).to.be.greaterThan(
      previous,
    );
    previous = position;
  }
  expect(observed.profile, 'selected profile reaches runtime metadata').to.eql(true);
  expect(observed.web, 'default public-web policy remains assembled').to.eql(true);
  expect(observed.fixture, 'fresh observer from this fixture').to.eql(profile);
  expect(observed.deno, 'actual child runtime').to.eql(Deno.version.deno);
  expect(observed.permissions, 'native lanes are denied as well as network/imports').to.eql(
    HOST_DENIED,
  );
  expect(observed.filesystem, 'sibling and admitted state are outside child authority').to.eql(
    outside.map((path) => ({ path, readGranted: false, writeGranted: false })),
  );
  if (!Is.array(observed.tools)) throw Err.std('Missing registered tools.');
  for (const name of ['remove', 'move', 'copy']) {
    const tool = observed.tools.find((tool) => Is.record(tool) && tool.name === name);
    expect(Is.record(tool) ? tool.path : undefined, `generated extension owns ${name}`).to.eql(
      extension,
    );
    expect(observed.active, `filesystem tool ${name} is active`).to.include(name);
  }
  const shutdown = text.split('\n').filter((line) => line.startsWith(SHUTDOWN));
  expect(shutdown, 'one cooperative RPC shutdown observation').to.have.length(1);
  expect(Json.parse(shutdown[0].slice(SHUTDOWN.length))).to.eql({ profile });
}

/**
 * Emit positions/booleans, never prompt bodies. session_start is not provider-payload evidence.
 * No generation request is submitted. Offline flags and child-side denials forbid startup traffic.
 */
function observerSource(profile: t.StringPath, outside: readonly string[]) {
  return Str.dedent(`
    export default function (pi) {
      const profile = ${Json.stringify(profile)};
      pi.on('session_shutdown', () => {
        console.log(${Json.stringify(SHUTDOWN)} + JSON.stringify({ profile }));
      });
      pi.on('session_start', async (_event, ctx) => {
        const text = ctx.getSystemPrompt();
        const permissions = {};
        for (const name of ${Json.stringify(Obj.keys(HOST_DENIED))}) {
          permissions[name] = (await Deno.permissions.query({ name })).state;
        }
        const filesystem = [];
        for (const path of ${Json.stringify(outside)}) {
          const read = await Deno.permissions.query({ name: 'read', path });
          const write = await Deno.permissions.query({ name: 'write', path });
          filesystem.push({ path, readGranted: read.state === 'granted', writeGranted: write.state === 'granted' });
        }
        console.log(${Json.stringify(PREFIX)} + JSON.stringify({
          positions: {
            base: text.indexOf('You are an expert coding assistant.'),
            system: text.indexOf('${SECRET}_SYSTEM'),
            agents: text.indexOf('${SECRET}_AGENTS'),
            context: text.indexOf('${SECRET}_extra'),
            filesystem: text.indexOf('# Runtime Tool Contract: remove'),
            metadata: text.indexOf('# Runtime Metadata'),
            safety: text.lastIndexOf('Provenance/security gates are hard stops:'),
          },
          profile: text.includes(profile),
          web: text.includes('A human request to research, verify, check, or consult external web sources'),
          fixture: profile,
          deno: Deno.version.deno,
          permissions,
          filesystem,
          tools: pi.getAllTools().map((tool) => ({ name: tool.name, path: tool.sourceInfo.path })),
          active: pi.getActiveTools(),
        }));
        ctx.shutdown();
      });
    }
  `);
}
