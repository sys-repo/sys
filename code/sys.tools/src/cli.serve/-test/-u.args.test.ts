import { describe, expect, it } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';

describe('@sys/tools/serve u.args', () => {
  it('defaults to interactive mode', () => {
    const res = parseArgs([]);
    expect(res.interactive).to.eql(true);
  });

  it('parses --non-interactive as strict mode', () => {
    const res = parseArgs(['--non-interactive', '--dir', '.', '--host', 'network', '--open', '--port', '4040']);
    expect(res['non-interactive']).to.eql(true);
    expect(res.interactive).to.eql(false);
    expect(res.dir).to.eql('.');
    expect(res.host).to.eql('network');
    expect(res.open).to.eql(true);
    expect(res.port).to.eql(4040);
  });
});
