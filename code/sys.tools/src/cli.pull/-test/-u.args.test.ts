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
      '--dist',
      'https://example.com/ui.components/dist.json',
      '--local',
      './view/components',
    ]);

    expect(res.command).to.eql('add');
    expect(res.interactive).to.eql(true);
    expect(res['dry-run']).to.eql(true);
    expect(res.config).to.eql('./-config/@sys.tools.pull/components.yaml');
    expect(res.dist).to.eql('https://example.com/ui.components/dist.json');
    expect(res.local).to.eql('./view/components');
  });
});
