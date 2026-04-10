import { describe, expect, Fs, it } from '../-test.ts';
import { Process, type t } from './common.ts';
import { cli } from './m.cli.ts';

describe('@sys/tools/code/m.cli', () => {
  it('inside @sys → delegates to the local driver-agent profile launcher', async () => {
    const prev = Process.inherit;
    const cwd = Fs.cwd('process');

    try {
      Process.inherit = async (input) => {
        expect(input.cmd).to.eql('deno');
        expect(input.cwd).to.eql(cwd);
        expect(input.env).to.eql({ INIT_CWD: cwd });
        expect(input.args).to.eql(['run', '-A', '@sys/driver-agent/pi/cli', 'Profiles', '--help']);
        return { code: 0, success: true, signal: null };
      };

      await cli(cwd, ['--help']);
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
        expect(input.env).to.eql({ INIT_CWD: cwd });
        expect(input.args.slice(0, 2)).to.eql(['run', '-A']);
        expect(input.args[2]).to.match(/^jsr:@sys\/driver-agent@.+\/pi\/cli$/);
        expect(input.args.slice(3)).to.eql(['Profiles', '--', '--model', 'gpt-5.4']);
        return { code: 0, success: true, signal: null };
      };

      await cli(cwd, ['--', '--model', 'gpt-5.4']);
    } finally {
      Process.inherit = prev;
    }
  });
});
