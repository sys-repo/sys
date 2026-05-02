import { describe, expect, Fs, it } from '../-test.ts';
import { Process, type t } from '../common.ts';
import { PiTool } from './t.ts';
import * as PiTools from './mod.ts';

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
    const prev = Process.inherit;
    const cwd = Fs.cwd('process');

    try {
      Process.inherit = async (input) => {
        expect(input.cmd).to.eql('deno');
        expect(input.cwd).to.eql(cwd);
        expect(input.env).to.eql(expectedEnv(cwd));
        expect(input.args).to.eql(['run', '-A', '@sys/driver-pi/cli', 'Profiles', '--help']);
        return { code: 0, success: true, signal: null };
      };

      await PiTools.cli(cwd, ['--help']);
    } finally {
      Process.inherit = prev;
    }
  });

  it('outside @sys → delegates to the pinned JSR profile launcher', async () => {
    const prev = Process.inherit;
    const cwd = Fs.join('/tmp', 'sys.tools.code.external') as t.StringDir;

    try {
      Process.inherit = async (input) => {
        expect(input.cmd).to.eql('deno');
        expect(input.cwd).to.eql(cwd);
        expect(input.env).to.eql(expectedEnv(cwd));
        expect(input.args.slice(0, 2)).to.eql(['run', '-A']);
        expect(input.args[2]).to.match(/^jsr:@sys\/driver-pi@.+\/cli$/);
        expect(input.args.slice(3)).to.eql(['Profiles', '--', '--model', 'gpt-5.4']);
        return { code: 0, success: true, signal: null };
      };

      await PiTools.cli(cwd, ['--', '--model', 'gpt-5.4']);
    } finally {
      Process.inherit = prev;
    }
  });

  it('forwards --git-root=cwd through the @sys/tools pi entrypoint', async () => {
    const prev = Process.inherit;
    const cwd = Fs.cwd('process');

    try {
      Process.inherit = async (input) => {
        expect(input.cmd).to.eql('deno');
        expect(input.cwd).to.eql(cwd);
        expect(input.env).to.eql(expectedEnv(cwd));
        expect(input.args).to.eql([
          'run',
          '-A',
          '@sys/driver-pi/cli',
          'Profiles',
          '--git-root=cwd',
        ]);
        return { code: 0, success: true, signal: null };
      };

      await PiTools.cli(cwd, ['--git-root=cwd']);
    } finally {
      Process.inherit = prev;
    }
  });

  it('ignores stale INIT_CWD when no cwd is passed explicitly', async () => {
    const prev = Process.inherit;
    const key = 'INIT_CWD';
    const before = Deno.env.get(key);
    const cwd = Fs.cwd('process');

    try {
      Deno.env.set(key, '/tmp/stale-init-cwd');
      Process.inherit = async (input) => {
        expect(input.cwd).to.eql(cwd);
        expect(input.env).to.eql(expectedEnv(cwd));
        return { code: 0, success: true, signal: null };
      };

      await PiTools.cli(undefined as never, ['--help']);
    } finally {
      Process.inherit = prev;
      before === undefined ? Deno.env.delete(key) : Deno.env.set(key, before);
    }
  });
});
