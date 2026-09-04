import { Cli, describe, expect, it } from '../../-test.ts';
import { help } from '../u.help.ts';

describe('cli.shell help', () => {
  it('renders concise usage, command descriptions, and dry-run-first examples', async () => {
    const raw = await help();
    const text = Cli.stripAnsi(raw);
    const lines = text.split('\n').map((line) => line.trim());

    expect(text).to.contain(
      'Shell profile manager: inspect profiles, enable @sys aliases, and update PATH.',
    );
    expect(text).not.to.contain('@sys/tools v');
    expect(text).to.contain('Usage');
    expect(text).to.contain('shell <command> [options]');
    expect(text).to.contain('Commands');
    expect(text).to.contain('doctor');
    expect(text).to.contain('diagnose shell, env, PATH, and profile setup (read-only)');
    expect(text).to.contain('alias enable <sys|common>');
    expect(text).to.contain('write managed aliases; add --dry-run to preview');
    expect(text).to.contain('init');
    expect(text).to.contain('initialize the recommended shell baseline');
    expect(lines).not.to.contain('shell alias enable <sys|common>');
    expect(lines).not.to.contain('shell path add deno');
    expect(lines).not.to.contain('shell apply');
    expect(text).not.to.contain('shell apply --dry-run');
    expect(text).to.contain('deno run -A jsr:@sys/tools shell alias enable sys --dry-run');
    expect(text).to.contain('deno run -A jsr:@sys/tools shell path add deno --dry-run');
    expect(text).to.contain('deno run -A jsr:@sys/tools shell init --dry-run');
  });
});
