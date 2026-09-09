import { describe, expect, it } from '../../-test.ts';
import { Cli, Fs } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

describe('@sys/tools/pull help', () => {
  it('explains pinned materialization ownership for Cell pulled views', async () => {
    const text = Cli.stripAnsi(await Fmt.help(Fs.cwd('terminal')));

    expect(text).to.include(
      'Pull owns checksum-pinned materialization and explicit mutable projection.',
    );
    expect(text).to.include(
      'Cell pulled-view setup uses Pull-owned config; the Cell descriptor remains unchanged.',
    );
    expect(text).to.include(
      'Pull config example: ./-config/@sys.tools.pull/components.yaml',
    );
    expect(text).to.include('deno run -A jsr:@sys/tools pull add');
    expect(text).to.include('Configure first, execute second.');
    expect(text).to.include('pull add mutates durable pull config state; it does not pull files.');
    expect(text).to.include('kind: dist');
    expect(text).to.include('manifest: https://example.com/ui.components/dist.json');
    expect(text).to.include('integrity: sha256-<publisher-provided-manifest-hash>');
    expect(text).to.include('store: ./.dist-store');
    expect(text).to.include('mode: replace');
    expect(text).to.not.include('kind: http');
  });

  it('requires independent publisher integrity without a TOFU affordance', async () => {
    const text = Cli.stripAnsi(await Fmt.addHelp(Fs.cwd('terminal')));

    expect(text).to.include('--manifest <url>');
    expect(text).to.include('--integrity <sha256>');
    expect(text).to.include('--store <path>');
    expect(text).to.include('--project <path>');
    expect(text).to.include('--mode <mode>');
    expect(text).to.include('publisher-provided exact manifest-byte SHA-256');
    expect(text).to.include('Hashing the same download cannot establish artifact authority.');
    expect(text).to.include('Mutable projection is optional');
    expect(text).to.not.include('--dist <url>');
    expect(text).to.not.include('--local <path>');
  });
});
