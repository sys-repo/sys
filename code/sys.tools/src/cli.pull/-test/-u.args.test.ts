import { describe, expect, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';

describe('@sys/tools/pull u.args', () => {
  it('defaults to interactive mode', () => {
    const res = parseArgs([]);
    expect(res.interactive).to.eql(true);
  });

  it('parses --non-interactive and --config', () => {
    const res = parseArgs([
      '--non-interactive',
      '--config',
      './-config/@sys.tools.pull/sample.yaml',
    ]);
    expect(res['non-interactive']).to.eql(true);
    expect(res.interactive).to.eql(false);
    expect(res.config).to.eql('./-config/@sys.tools.pull/sample.yaml');
  });

  it('parses the add command and config mutation flags', () => {
    const res = parseArgs([
      'add',
      '--dry-run',
      '--config',
      './-config/@sys.tools.pull/components.yaml',
      '--manifest',
      'https://example.com/ui.components/dist.json',
      '--integrity',
      `sha256-${'a'.repeat(64)}`,
      '--store',
      './.dist-store',
      '--project',
      './view/components',
      '--mode',
      'replace',
    ]);

    expect(res.command).to.eql('add');
    expect(res.interactive).to.eql(true);
    expect(res['dry-run']).to.eql(true);
    expect(res.config).to.eql('./-config/@sys.tools.pull/components.yaml');
    expect(res.manifest).to.eql('https://example.com/ui.components/dist.json');
    expect(res.integrity).to.eql(`sha256-${'a'.repeat(64)}`);
    expect(res.store).to.eql('./.dist-store');
    expect(res.project).to.eql('./view/components');
    expect(res.mode).to.eql('replace');
  });
});
