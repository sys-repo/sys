import { describe, expect, it } from '../../../-test.ts';
import { Fs, Json, Obj, pkg, Str, type t } from '../common.ts';
import { PiSandboxReport } from '../../u/u.report.sandbox.ts';
import { PI_AGENT_IMPORT, PI_AGENT_IMPORT_BASE, reportPkg } from '../../u/u.resolve.pkg.ts';
import { resolveRun } from '../u/u.resolve.run.ts';

const SECRETS = {
  system: 'REPORT_SECRET_SYSTEM',
  agents: 'REPORT_SECRET_AGENTS',
  context: 'REPORT_SECRET_CONTEXT',
  prompt: 'REPORT_SECRET_CUSTOM_PROMPT',
  environment: 'REPORT_SECRET_ENVIRONMENT',
  specifier: 'REPORT_SECRET_SPECIFIER',
} as const;

describe('@sys/driver-pi/cli/reporting', () => {
  describe('package disclosure', () => {
    it('known-stem numeric releases → selection identity without a compatibility claim', () => {
      expect(reportPkg(PI_AGENT_IMPORT)).to.eql(PI_AGENT_IMPORT);
      const unsupported = `${PI_AGENT_IMPORT_BASE}@0.83.0`;
      expect(reportPkg(unsupported)).to.eql(unsupported);
    });

    it('custom or malformed specifiers → whole-value redaction', () => {
      const secret = SECRETS.specifier;
      const cases = [
        // The trailing newline is intentional input, not fixture formatting.
        { name: 'trailing control character', value: `${PI_AGENT_IMPORT}\n` },
        { name: 'known stem with query', value: `${PI_AGENT_IMPORT}?token=${secret}` },
        { name: 'URL credentials', value: `https://user:${secret}@example.com/agent.ts` },
        { name: 'URL path', value: `https://example.com/${secret}/agent.ts` },
        { name: 'URL fragment', value: `https://example.com/agent.ts#${secret}` },
        { name: 'local module', value: `file:///tmp/${secret}/agent.ts` },
        { name: 'custom npm package', value: `npm:custom-package@${secret}` },
      ];
      for (const { name, value } of cases) {
        expect(reportPkg(value), name).to.eql('custom (redacted; identity unknown)');
      }
    });
  });

  describe('resolved profile snapshots', () => {
    it('default prompt → ordered SYSTEM, AGENTS, and appended-context identities without bodies', async () => {
      await using fixture = await createProfileFixture();
      const { cwd, config } = fixture;
      const { resolved, report } = await fixture.resolve();

      expect(report).to.contain(`- pkg: ${pkg.name}@${pkg.version}`);
      expect(report).to.contain(`- upstream selection: ${PI_AGENT_IMPORT}`);
      expect(report).to.contain('- upstream selection source: dependency/fallback');
      expect(report).to.contain(`- profile: ${config}`);
      expect(report).to.contain('- system prompt: default');
      expect(report).to.contain('- observation: launch-input');
      expect(resolved.sandbox.launch?.resolvedAt).to.match(/^\d{4}-\d{2}-\d{2}T/);
      expect(report).to.contain(`- resolved at: ${resolved.sandbox.launch?.resolvedAt}`);
      expect(report).to.contain(Str.dedent(`
        ### Instruction Contributions (launcher order)
        1. system prompt: default
        2. system file: ${Fs.join(cwd, 'SYSTEM.md')}
        3. context file: ${Fs.join(cwd, 'AGENTS.md')}
        4. context file: ${Fs.join(cwd, 'extra.md')}
        5. runtime metadata
        6. final provenance safety
      `));
      expectNoSecrets(report);

      // Redaction is a reporting boundary, not removal from the actual launch inputs.
      expect(resolved.env.REPORT_SECRET).to.eql(SECRETS.environment);
      expect(resolved.args.join('\n')).to.contain(SECRETS.system);
    });

    it('custom prompt and package → preserved launch inputs, omitted SYSTEM, and unknown tool identity', async () => {
      await using fixture = await createProfileFixture();
      const { cwd } = fixture;
      const upstream = `https://user:${SECRETS.specifier}@example.com/agent.ts`;
      const { resolved, report } = await fixture.resolve({ system: SECRETS.prompt, pkg: upstream });

      expect(report).to.contain('- system prompt: custom');
      expect(report).to.contain('- upstream selection source: explicit');
      expect(report).to.contain('- upstream selection: custom (redacted; identity unknown)');
      expect(report).to.contain('- selected tools: unknown');
      expect(report).to.contain('- live tools/runtime: unknown (not observed)');
      expect(report).to.contain(Str.dedent(`
        ### Instruction Contributions (launcher order)
        1. system prompt: custom
        2. context file: ${Fs.join(cwd, 'AGENTS.md')}
        3. context file: ${Fs.join(cwd, 'extra.md')}
        4. runtime metadata
        5. final provenance safety
      `));
      expect(report).not.to.contain('system file:');
      expectNoSecrets(report);
      expect(resolved.tools).to.eql(undefined);
      expect(resolved.pkg).to.eql(upstream);
      expect(resolved.args.join('\n')).to.contain(SECRETS.prompt);
      expect(resolved.args.join('\n')).not.to.contain(SECRETS.system);
    });
  });
});

/** Acquire ownership before writing inputs so a failed setup is also cleaned up. */
async function createProfileFixture() {
  const cwd = (await Fs.makeTempDir({ prefix: 'driver-pi.reporting.' })).absolute;
  const config = Fs.join(cwd, 'profile.yaml');
  return {
    cwd,
    config,
    async resolve(input: { system?: string; pkg?: t.StringModuleSpecifier } = {}) {
      await Fs.write(Fs.join(cwd, 'SYSTEM.md'), SECRETS.system, { throw: true });
      await Fs.write(Fs.join(cwd, 'AGENTS.md'), SECRETS.agents, { throw: true });
      await Fs.write(Fs.join(cwd, 'extra.md'), SECRETS.context, { throw: true });
      await Fs.write(
        config,
        Json.stringify({
          prompt: { system: input.system ?? null },
          sandbox: {
            context: { append: ['./extra.md'] },
            capability: { env: { REPORT_SECRET: SECRETS.environment } },
          },
        }),
        { throw: true },
      );
      const resolved = await resolveRun({
        cwd: { invoked: cwd, root: cwd },
        config,
        pkg: input.pkg,
        ocr: { preflight: false },
      }, { extensions: false });
      const report = PiSandboxReport.text({ cwd, sandbox: resolved.sandbox });
      return { resolved, report };
    },
    async [Symbol.asyncDispose]() {
      await Fs.remove(cwd);
    },
  };
}

function expectNoSecrets(report: string) {
  for (const [lane, secret] of Obj.entries(SECRETS)) {
    expect(report, `${lane} content must not enter the report`).not.to.contain(secret);
  }
}
