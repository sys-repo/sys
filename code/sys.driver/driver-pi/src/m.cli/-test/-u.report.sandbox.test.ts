import { describe, expect, it } from '../../-test.ts';
import { pkg, Str, type t } from '../common.ts';
import { PiSandboxReport } from '../u/u.report.sandbox.ts';

const CWD = '/tmp/pi-cli-test';

describe('@sys/driver-pi/cli/u.report.sandbox', () => {
  describe('artifact location', () => {
    it('dir → derives the project log directory from the shared Pi filesystem contract', () => {
      expect(PiSandboxReport.dir(CWD)).to.eql(`${CWD}/.pi/@sys/log/@sys.driver-pi`);
    });

    it('fileOf → names timestamped Markdown reports without writing them', () => {
      const path = PiSandboxReport.fileOf(CWD);
      expect(path).to.contain(`${CWD}/.pi/@sys/log/@sys.driver-pi/`);
      expect(path).to.match(/\/\d+\.[a-z0-9]+\.sandbox\.log\.md$/);
    });
  });

  describe('Deno authority and complete scope details', () => {
    for (const permissions of ['scoped', 'allow-all'] as const) {
      it(`${permissions} → no launcher-supplied confinement or inferred enclosing protection`, () => {
        const sandbox = { ...sandboxOf(), permissions };
        const text = PiSandboxReport.text({ cwd: CWD, sandbox });
        expect(text).to.contain(Str.dedent(`
          ## Authority
          - Deno API permissions: ${permissions}
          - Process sandbox: not provided by Pi-Driver
          - Outer sandbox: unknown
          - Deno path limits do not constrain Bash or its subprocesses.
        `));
      });
    }

    it('scoped → preserves complete read, write, and context sections without terminal clipping', () => {
      const text = PiSandboxReport.text({
        cwd: CWD,
        sandbox: {
          permissions: 'scoped',
          cwd: { invoked: `${CWD}/nested`, git: CWD },
          read: {
            summary: ['cwd', 'runtime'],
            detail: [`${CWD}/.pi/@sys/tmp/deno`, '/bin/bash'],
          },
          write: { summary: ['cwd', 'temp'], detail: ['/var/tmp/pi'] },
          context: { include: [`${CWD}/canon.md`] },
        },
      });

      expect(text).to.contain('# Pi Deno Permissions and Launcher Inputs');
      expect(text).to.contain(`- pkg: ${pkg.name}@${pkg.version}`);
      expect(text).to.contain(`- cwd.git: ${CWD}`);
      expect(text).to.contain(`- cwd.invoked: ${CWD}/nested`);
      expect(text).to.contain(Str.dedent(`
        ## Summary
        - read: cwd + runtime
        - write: cwd + tmp
        - context: loaded context (wrapper-owned prompt)

        ## Readable Paths
        - ${CWD}/.pi/@sys/tmp/deno
        - /bin/bash

        ## Writable Paths
        - ${CWD}
        - /var/tmp/pi

        ## Context Files
        - ${CWD}/canon.md
      `));
    });

    it('allow-all → reports Deno-wide grants instead of the configured path subsets', () => {
      const text = PiSandboxReport.text({
        cwd: CWD,
        sandbox: {
          ...sandboxOf(),
          permissions: 'allow-all',
          read: { summary: ['cwd'], detail: [`${CWD}/read-subset`] },
          write: { summary: ['cwd'], detail: [`${CWD}/write-subset`] },
        },
      });

      expect(text).to.contain(Str.dedent(`
        ## Summary
        - read: all
        - write: all
        - context: -

        ## Readable Paths
        - all (Deno --allow-all)

        ## Writable Paths
        - all (Deno --allow-all)

        ## Context Files
        - none
      `));
      expect(text).not.to.contain('read-subset');
      expect(text).not.to.contain('write-subset');
    });
  });

  describe('observation boundaries', () => {
    it('missing input metadata → unknown, not an inferred launch or tool selection', () => {
      const text = PiSandboxReport.text({ cwd: CWD, sandbox: sandboxOf() });
      expect(text).to.contain(Str.dedent(`
        ## Launcher Input Snapshot
        - observation: unknown
        - resolved at: unknown
        - upstream selection: unknown
        - upstream selection source: unknown
        - profile: unknown
        - system prompt: unknown
        - selected tools: unknown
        - live tools/runtime: unknown (not observed)
      `));
      expect(text).to.contain(Str.dedent(`
        ### Instruction Contributions (launcher order)
        - unknown
      `));
    });

    for (const stage of ['preview', 'launch-input'] as const) {
      it(`${stage} → retains the supplied observation time without claiming execution`, () => {
        const launch: t.PiCli.LaunchIdentity = {
          stage,
          resolvedAt: '2001-02-03T04:05:06.000Z',
          upstream: 'custom (redacted; identity unknown)',
          upstreamExplicit: true,
          profile: `${CWD}/profile.yaml`,
          system: 'custom',
          contributions: ['system prompt: custom', 'final provenance safety'],
          tools: [],
        };
        const text = PiSandboxReport.text({ cwd: CWD, sandbox: { ...sandboxOf(), launch } });
        expect(text).to.contain(`- observation: ${stage}`);
        expect(text).to.contain(`- resolved at: ${launch.resolvedAt}`);
        expect(text).to.contain('- selected tools: none');
        expect(text).to.contain('- live tools/runtime: unknown (not observed)');
        expect(text).to.contain(
          'Not session or provider-prompt evidence; paths do not attest content identity.',
        );
        expect(text).to.contain(
          'Preview omits extension materialization and OCR preflight; launch-input means prepared, not executed.',
        );
      });
    }

    it('git-root selection → distinguishes explicit and inferred provenance', () => {
      const input = { cwd: CWD, sandbox: sandboxOf() };
      const inferred = PiSandboxReport.text(input);
      const explicit = PiSandboxReport.text({ ...input, gitRootExplicit: true });

      expect(inferred).to.contain('- cwd.git-root: inferred');
      expect(inferred).not.to.contain('- cwd.git-root: explicit');
      expect(explicit).to.contain('- cwd.git-root: explicit');
      expect(explicit).not.to.contain('- cwd.git-root: inferred');
    });
  });
});

function sandboxOf(): t.PiCli.SandboxSummary {
  return {
    permissions: 'scoped',
    cwd: { invoked: CWD, git: CWD },
    read: { summary: ['cwd'], detail: [CWD] },
    write: { summary: ['cwd'], detail: [] },
  };
}
