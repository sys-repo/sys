import { Path } from '@sys/std/path';
import { Raw } from '../../src/m.cli/m.raw/mod.ts';
import { resolveRun } from '../../src/m.cli/m.profiles/u/u.resolve.run.ts';
import { withInherit } from '../../src/m.cli/u/u.inherit.ts';
import { PiSandboxReport } from '../../src/m.cli/u/u.report.sandbox.ts';
import { PI_AGENT_IMPORT } from '../../src/m.cli/u/u.resolve.pkg.ts';
import { describe, Err, expect, Fs, Is, it, Json, Obj, Process, Str, type t } from '../common.ts';

const PREFIX = 'SYS_REPORT_HOST ';
const SECRET = 'REPORT_HOST_SECRET_SENTINEL';

/** One real-host capstone; the unit suites own the input and rendering permutations. */
describe('Pi: launcher reporting host', () => {
  it('resolved snapshot → selected CLI assembles its inputs at session_start', async () => {
    await using fixture = await createHostFixture();
    const { root } = fixture;
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
    await Fs.write(extension, observerSource(config), { throw: true });

    const resolved = await resolveRun({
      cwd: { invoked: root, root },
      config,
      args: ['--mode', 'rpc', '--no-session'],
      env: { TMPDIR: fixture.tmp, TMP: fixture.tmp, TEMP: fixture.tmp },
    });
    expect(resolved.pkg).to.eql(PI_AGENT_IMPORT);
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
    expect(report.data).to.contain(`- upstream selection: ${PI_AGENT_IMPORT}`);

    const output = await fixture.capture({
      ...resolved,
      args: [...resolved.args, '--extension', extension],
    });
    expectHostAssembly(output);
  });
});

/** Own the child and its files together: uncertain settlement must retain the fixture. */
async function createHostFixture() {
  const packageRoot = Fs.resolve(import.meta.dirname ?? '.', '../..');
  const tmp = Fs.join(packageRoot, '.tmp');
  await Fs.ensureDir(tmp);
  const root = (await Fs.makeTempDir({ dir: tmp, prefix: 'report-host.' })).absolute;
  let unsettled = false;

  return {
    root,
    tmp,
    async capture(input: t.PiCli.RunArgs): Promise<t.Process.CaptureOutput> {
      const captures: t.Process.CaptureOutput[] = [];
      await withInherit(async (request) => {
        for (const key of ['DENO_DIR', 'HOME', 'PI_CODING_AGENT_DIR']) {
          expect(Path.Is.within(root, request.env?.[key]), `${key} must be fixture-owned`).to.eql(
            true,
          );
        }
        unsettled = true;
        const output = await Process.capture({
          ...request,
          // Fixture-only isolation; production environment inheritance is unchanged.
          clearEnv: true,
          executionTimeout: 120_000,
          maxStdoutBytes: 65_536,
          maxStderrBytes: 262_144,
        });
        captures.push(output);
        unsettled = output.outcome !== 'failed-to-start' && output.status === null;
        if (output.outcome !== 'exited') {
          throw Err.std(`Host did not settle: ${output.outcome}\n${output.text.stderr}`);
        }
        return { code: output.code, success: output.success, signal: output.signal };
      }, () => Raw.run(input));
      expect(captures, 'exactly one selected CLI child').to.have.length(1);
      return captures[0];
    },
    async [Symbol.asyncDispose]() {
      if (unsettled) {
        throw Err.std(`Host settlement unconfirmed; fixture retained at ${root}`);
      }
      await Fs.remove(root);
    },
  };
}

/** Admit complete child evidence before interpreting any assembly positions. */
function expectHostAssembly(output: t.Process.CaptureOutput) {
  expect(output.success, output.text.stderr).to.eql(true);
  expect(output.stdoutTruncated, 'complete host evidence').to.eql(false);
  expect(output.stderrTruncated, 'complete host diagnostics').to.eql(false);
  const lines = output.text.stdout.split('\n').filter((line) => line.startsWith(PREFIX));
  expect(lines, output.text.stdout).to.have.length(1);
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
}

/**
 * Emit positions/booleans, never prompt bodies. session_start is not provider-payload evidence.
 * No generation request is submitted; upstream startup may still refresh public model catalogs.
 */
function observerSource(profile: t.StringPath) {
  return Str.dedent(`
    export default function (pi) {
      pi.on('session_start', (_event, ctx) => {
        const text = ctx.getSystemPrompt();
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
          profile: text.includes(${Json.stringify(profile)}),
          web: text.includes('A human request to research, verify, check, or consult external web sources'),
        }));
        ctx.shutdown();
      });
    }
  `);
}
