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
    expect(text).to.include('deno run -A jsr:@sys/tools pull add');
    expect(text).to.include('Configure first, execute second.');
    expect(text).to.include('pull add mutates durable pull config state; it does not pull files.');
    expect(text).to.include(
      'Non-interactive pull execution runs an existing config; it does not create one from flags.',
    );
    expect(text).to.include(
      'deno run -A jsr:@sys/tools pull add --config ./-config/@sys.tools.pull/components.yaml --dist https://example.com/ui.components/dist.json --local ./view/components',
    );
    expect(text).to.include('dist: https://example.com/ui.components/dist.json');
    expect(text).to.include('dir: ./view/components');
  });

  it('documents add as the deterministic config mutation command', async () => {
    const text = Cli.stripAnsi(await Fmt.addHelp(Fs.cwd('terminal')));

    expect(text).to.include('deno run -A jsr:@sys/tools pull add');
    expect(text).to.include('HTTP dist.json URL to record');
    expect(text).to.include('Missing config is created with the minimal pull YAML shape.');
    expect(text).to.include(
      'Adds one HTTP dist bundle to durable pull config state; it does not pull files.',
    );
    expect(text).to.include('An exact existing dist/local bundle is a no-op success.');
    expect(text).to.include('A reused local target with a different source fails.');
    expect(text).to.include(
      'Next: deno run -A jsr:@sys/tools pull --non-interactive --config ./-config/@sys.tools.pull/components.yaml',
    );
  });
});
