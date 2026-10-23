import { describe, expect, it } from '../../-test.ts';
import { Cli, Fs } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

describe('@sys/tools/deploy help', () => {
  it('documents supported direct endpoint actions', async () => {
    const text = Cli.stripAnsi(await Fmt.help(Fs.cwd('terminal')));

    expect(text).to.include(
      'deno run -A jsr:@sys/tools deploy --non-interactive --config ./my-config.yaml --action stage',
    );
    expect(text).to.include(
      'deno run -A jsr:@sys/tools deploy --non-interactive --config ./my-config.yaml --action push',
    );
    expect(text).to.include(
      'deno run -A jsr:@sys/tools deploy --non-interactive --config ./my-config.yaml --action stage+push',
    );
    expect(text).to.include('--action <stage|push|stage+push>');
    expect(text).to.include('--force');
    expect(text).to.include(
      'deno run -A jsr:@sys/tools deploy --non-interactive --config ./my-config.yaml --action push --force',
    );
  });
});
