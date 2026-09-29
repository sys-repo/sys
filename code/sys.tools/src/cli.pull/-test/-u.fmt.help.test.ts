import { describe, expect, it } from '../../-test.ts';
import { Cli, Fs } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

describe('@sys/tools/pull help', () => {
  it('explains content-pinned materialization and the configure → execute workflow', async () => {
    const text = Cli.stripAnsi(await Fmt.help(Fs.cwd('terminal')));

    expect(text).to.include(
      'Pull owns content-pinned materialization and explicit mutable projection.',
    );
    expect(text).to.not.include('Cell descriptor');
    expect(text).to.include(
      'Pull config example: ./-config/@sys.tools.pull/components.yaml',
    );
    expect(text).to.include('deno run -A jsr:@sys/tools pull add');
    expect(text).to.include('Configure first, execute second.');
    expect(text).to.include('pull add mutates durable pull config state; it does not pull files.');
    expect(text).to.include('kind: dist');
    expect(text).to.include('manifest: https://example.com/ui.components/dist.json');
    expect(text).to.include('scheme: sys.dist/v2');
    expect(text).to.include('digest: sha256-<publisher-provided-content-digest>');
    expect(text).to.include('store: ./.dist-store');
    expect(text).to.include('mode: replace');
    expect(text).to.not.include('kind: http');
  });

  it('independent content pin → no TOFU affordance', async () => {
    const text = Cli.stripAnsi(await Fmt.addHelp(Fs.cwd('terminal')));

    expect(text).to.include('--manifest <url>');
    expect(text).to.include('--scheme <scheme>');
    expect(text).to.include('--digest <sha256>');
    expect(text).to.not.include('--integrity');
    expect(text).to.include('--store <path>');
    expect(text).to.include('--project <path>');
    expect(text).to.include('--mode <mode>');
    expect(text).to.include('independently supplied canonical content digest');
    expect(text).to.include('Hashing the same download cannot establish artifact authority.');
    expect(text).to.include('Mutable projection is optional');
    expect(text).to.not.include('--dist <url>');
    expect(text).to.not.include('--local <path>');
  });

  it('help and add help → explain path anchors and destructive projection choices', async () => {
    for (const help of [Fmt.help, Fmt.addHelp]) {
      const text = Cli.stripAnsi(await help(Fs.cwd('terminal')));
      expect(text).to.include('Standard layout: <workspace>/-config/@sys.tools.pull/<name>.yaml.');
      expect(text).to.include('two levels above the YAML directory');
      expect(text).to.include(
        'YAML dir resolves from that anchor; an absolute dir is used directly.',
      );
      expect(text).to.include('store and project.dir resolve beneath the resulting dir');
      expect(text).to.include('Relocating config can change output paths without changing YAML.');
      expect(text).to.include('create refuses an occupied target.');
      expect(text).to.include('replace removes the existing target before promotion');
      expect(text).to.include('later failure does not restore it.');
      expect(text).to.include('Projected HTML may be rewritten');
      expect(text).to.include('verification remains with the sealed generation.');
    }
  });
});
