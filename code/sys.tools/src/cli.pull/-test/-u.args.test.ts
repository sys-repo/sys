import { describe, expect, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';

describe('@sys/tools/pull u.args', () => {
  it('defaults to interactive mode', () => {
    const res = parseArgs([]);
    expect(res.interactive).to.eql(true);
  });

  it('parses --no-interactive and --config', () => {
    const res = parseArgs(['--no-interactive', '--config', './-config/@sys.tools.pull/sample.yaml']);
    expect(res['no-interactive']).to.eql(true);
    expect(res.interactive).to.eql(false);
    expect(res.config).to.eql('./-config/@sys.tools.pull/sample.yaml');
  });
});
