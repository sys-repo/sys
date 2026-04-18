import { Cli, describe, expect, it } from '../../../-test.ts';
import { formatServeActionName } from '../u/u.promptEndpointAction.ts';

describe('Deploy: promptEndpointAction', () => {
  it('formats serve action with explicit port label', () => {
    const res = formatServeActionName(4040);
    expect(Cli.stripAnsi(res)).to.eql('  serve   port:4040');
  });

  it('formats serve action with overridden port label', () => {
    const res = formatServeActionName(4041);
    expect(Cli.stripAnsi(res)).to.eql('  serve   port:4041');
  });
});
