import { Cli, describe, expect, it } from '../../../-test.ts';
import {
  formatPushActionName,
  formatServeActionName,
  promptEndpointActionWith,
} from '../u/u.promptEndpointAction.ts';

describe('Deploy: promptEndpointAction', () => {
  it('uses an empty prompt message so the selector renders as bare ?', async () => {
    let message = '<unset>';
    const res = await promptEndpointActionWith(
      {
        checkOk: true,
        ranOk: false,
        showPush: false,
        showStagePush: false,
        showServe: false,
        servePort: 4040,
        pushedOk: false,
        hashPrefix: '#81960',
        hasStageMeta: false,
      },
      (args) => {
        message = args.message ?? '';
        return Promise.resolve('back');
      },
    );

    expect(res).to.eql('back');
    expect(message).to.eql('');
  });

  it('formats serve action with explicit port label', () => {
    const res = formatServeActionName(4040);
    expect(Cli.stripAnsi(res)).to.eql('  serve   port:4040');
  });

  it('formats serve action with overridden port label', () => {
    const res = formatServeActionName(4041);
    expect(Cli.stripAnsi(res)).to.eql('  serve   port:4041');
  });

  it('formats pushed action size without staging label', () => {
    const res = formatPushActionName({
      pushedOk: true,
      hashPrefix: '#81960',
      pushElapsed: '507ms',
      pushBytes: 284,
      pushUrl: 'https://example.com',
    });

    expect(Cli.stripAnsi(res)).to.eql(
      '  #81960  pushed ✔ - https://example.com (in 507ms, 284 B)',
    );
  });

  it('formats pushed action shard count and size symmetrically', () => {
    const res = formatPushActionName({
      pushedOk: true,
      hashPrefix: '#81960',
      pushElapsed: '2s',
      pushShards: 2,
      pushBytes: 284,
    });

    expect(Cli.stripAnsi(res)).to.eql('  #81960  pushed ✔ (in 2s, 2 shards, 284 B)');
  });
});
