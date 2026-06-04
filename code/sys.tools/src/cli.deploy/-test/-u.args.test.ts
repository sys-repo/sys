import { describe, expect, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';

describe('@sys/tools/deploy u.args', () => {
  it('defaults to interactive mode', () => {
    const res = parseArgs([]);
    expect(res.interactive).to.eql(true);
  });

  it('parses --non-interactive, --config, and --action', () => {
    const res = parseArgs([
      '--non-interactive',
      '--config',
      './-config/@sys.tools.deploy/slc.yaml',
      '--action',
      'stage+push',
      '--force',
    ]);

    expect(res['non-interactive']).to.eql(true);
    expect(res.interactive).to.eql(false);
    expect(res.config).to.eql('./-config/@sys.tools.deploy/slc.yaml');
    expect(res.action).to.eql('stage+push');
    expect(res.force).to.eql(true);
  });
});
