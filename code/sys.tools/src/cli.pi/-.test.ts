import { describe, expect, Fs, it } from '../-test.ts';
import { type t } from '../common.ts';
import { PiTool } from './t.ts';
import * as PiTools from './mod.ts';
import { cliPiWith, type PiCliDeps } from './u.run.ts';

function expectedEnv(cwd: t.StringDir) {
  return {
    INIT_CWD: cwd,
    PI_CLI_PROFILES_HELP_TOOL: 'deno run -A jsr:@sys/tools pi',
  } as const;
}

describe(PiTool.NAME, () => {
  it('API', async () => {
    const m = await import('@sys/tools/pi');
    expect(m.cli).to.equal(PiTools.cli);
  });

  it('inside @sys → delegates to the local driver-pi profile launcher', async () => {
    const cwd = Fs.cwd('process');
    await run(cwd, ['--help'], async (input) => {
      expect(input.cmd).to.eql('deno');
      expect(input.cwd).to.eql(cwd);
      expect(input.env).to.eql(expectedEnv(cwd));
      expect(input.args).to.eql(['run', '-A', '@sys/driver-pi/cli', '--help']);
      return { code: 0, success: true, signal: null };
    });
  });

  it('outside @sys → delegates to the pinned JSR profile launcher', async () => {
    const cwd = Fs.join('/tmp', 'sys.tools.code.external') as t.StringDir;
    await run(cwd, ['--', '--model', 'gpt-5.4'], async (input) => {
      expect(input.cmd).to.eql('deno');
      expect(input.cwd).to.eql(cwd);
      expect(input.env).to.eql(expectedEnv(cwd));
      expect(input.args.slice(0, 2)).to.eql(['run', '-A']);
      expect(input.args[2]).to.match(/^jsr:@sys\/driver-pi@.+\/cli$/);
      expect(input.args.slice(3)).to.eql(['--', '--model', 'gpt-5.4']);
      return { code: 0, success: true, signal: null };
    });
  });

  it('inside @sys → delegates Pi-Driver DSL help with narrow read/env permissions', async () => {
    const cwd = Fs.cwd('process');
    await run(cwd, ['dsl', 'profile', '--format', 'skill'], async (input) => {
      expect(input.cmd).to.eql('deno');
      expect(input.cwd).to.eql(cwd);
      expect(input.env).to.eql(expectedEnv(cwd));
      expect(input.args).to.eql([
        'run',
        '-ER',
        '@sys/driver-pi/cli',
        'dsl',
        'profile',
        '--format',
        'skill',
      ]);
      return { code: 0, success: true, signal: null };
    });
  });

  it('outside @sys → delegates Pi-Driver DSL help to the pinned JSR launcher with narrow permissions', async () => {
    const cwd = Fs.join('/tmp', 'sys.tools.code.external') as t.StringDir;
    await run(cwd, ['dsl', 'tools'], async (input) => {
      expect(input.cmd).to.eql('deno');
      expect(input.cwd).to.eql(cwd);
      expect(input.env).to.eql(expectedEnv(cwd));
      expect(input.args.slice(0, 2)).to.eql(['run', '-ER']);
      expect(input.args[2]).to.match(/^jsr:@sys\/driver-pi@.+\/cli$/);
      expect(input.args.slice(3)).to.eql(['dsl', 'tools']);
      return { code: 0, success: true, signal: null };
    });
  });

  it('forwards --git-root=cwd through the @sys/tools pi entrypoint', async () => {
    const cwd = Fs.cwd('process');
    await run(cwd, ['--git-root=cwd'], async (input) => {
      expect(input.cmd).to.eql('deno');
      expect(input.cwd).to.eql(cwd);
      expect(input.env).to.eql(expectedEnv(cwd));
      expect(input.args).to.eql(['run', '-A', '@sys/driver-pi/cli', '--git-root=cwd']);
      return { code: 0, success: true, signal: null };
    });
  });

  it('ignores stale INIT_CWD when no cwd is passed explicitly', async () => {
    const key = 'INIT_CWD';
    const before = Deno.env.get(key);
    const cwd = Fs.cwd('process');

    try {
      Deno.env.set(key, '/tmp/stale-init-cwd');
      await run(undefined, ['--help'], async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.env).to.eql(expectedEnv(cwd));
        return { code: 0, success: true, signal: null };
      });
    } finally {
      before === undefined ? Deno.env.delete(key) : Deno.env.set(key, before);
    }
  });
});

async function run(
  cwd: t.StringDir | undefined,
  argv: string[],
  inherit: PiCliDeps['inherit'],
) {
  await cliPiWith(cwd, argv, { inherit });
}
