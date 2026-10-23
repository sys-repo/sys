import { describe, expect, it } from '../../-test.ts';
import { Cli, Fs } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

describe('@sys/tools/serve help', () => {
  it('Dist status → describes observation without payload verification', async () => {
    const text = Cli.stripAnsi(await Fmt.help(Fs.cwd('terminal')));
    expect(text).to.include('Static Serve does not require an independent pin');
    expect(text).to.include('or verify served payload bytes.');
    expect(text).to.include('Displayed Dist metadata does not authenticate served bytes');
    expect(text).to.include('size and build time are descriptive.');
  });
});
