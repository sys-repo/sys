import { describe, expect, it } from '../../-test.ts';
import { Cli, Fs } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

describe('@sys/tools/pull help', () => {
  it('explains pull ownership for Cell DSL pulled views', async () => {
    const text = Cli.stripAnsi(await Fmt.help(Fs.cwd('terminal')));

    expect(text).to.include('Pull owns materialization: remote source → local target.');
    expect(text).to.include(
      'Cell views reference the pull config path, not the dist URL or local directory.',
    );
    expect(text).to.include(
      'views.components.source.pull = ./-config/@sys.tools.pull/components.yaml',
    );
    expect(text).to.include(
      'Non-interactive mode executes an existing config; it does not create one from flags.',
    );
    expect(text).to.include(
      'deno run -A jsr:@sys/tools pull --non-interactive --config ./-config/@sys.tools.pull/components.yaml',
    );
    expect(text).to.include('dist: https://fs.db.team/ui.components/dist.json');
    expect(text).to.include('dir: ./view/components');
  });
});
