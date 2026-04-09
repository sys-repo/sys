import { describe, expect, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';

describe('@sys/tools/serve u.args', () => {
  it('defaults to interactive mode', () => {
    const res = parseArgs([]);
    expect(res.interactive).to.eql(true);
  });

  it('parses --no-interactive as strict mode', () => {
    const res = parseArgs(['--no-interactive', '--port', '4040']);
    expect(res['no-interactive']).to.eql(true);
    expect(res.interactive).to.eql(false);
    expect(res.port).to.eql(4040);
  });
});
