import { describe, expect, Fs, it } from '../-test.ts';
import { Process, type t } from './common.ts';
import { cli } from './m.cli.ts';

describe('@sys/tools/code/m.cli', () => {
  it('delegates to deno with INIT_CWD pinned to the requested cwd', async () => {
    const prev = Process.inherit;
    const cwd = Fs.join(Fs.cwd('process'), 'tmp.code.cli') as t.StringDir;

    try {
      Process.inherit = async (input) => {
        expect(input.cmd).to.eql('deno');
        expect(input.cwd).to.eql(cwd);
        expect(input.env).to.eql({ INIT_CWD: cwd });
        expect(input.args.slice(0, 2)).to.eql(['run', '-A']);
        expect(input.args[2]).to.match(/^(?:@sys\/driver-agent\/pi\/cli|jsr:@sys\/driver-agent@.+\/pi\/cli)$/);
        expect(input.args.at(-1)).to.eql('--help');
        return { code: 0, success: true, signal: null };
      };

      await cli(cwd, ['--help']);
    } finally {
      Process.inherit = prev;
    }
  });
});
