import { describe, expect, it } from '../../-test.ts';
import { Cli, Fs } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

describe('@sys/tools/serve help', () => {
  it('disambiguates operator serve from Cell runtime static service config', async () => {
    const text = Cli.stripAnsi(await Fmt.help(Fs.cwd('terminal')));

    expect(text).to.include('Cell runtime');
    expect(text).to.include('operator CLI for serving a directory');
    expect(text).to.include('deno run -ERW jsr:@sys/http/server/static config add');
    expect(text).to.include("from: '@sys/http/server/static'");
    expect(text).to.include('export: HttpStatic');
  });
});
