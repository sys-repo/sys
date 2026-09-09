import { describe, expect, it } from '../../-test.ts';
import { Cli } from '../../m.core/mod.ts';
import { FakeSpinner, withSelectPrompt } from '../mod.ts';

describe('CLI: testing / API', () => {
  it('exports the FakeSpinner surface', async () => {
    const m = await import('@sys/cli/testing');

    expect(m.FakeSpinner).to.equal(FakeSpinner);
    expect(m.withSelectPrompt).to.equal(withSelectPrompt);
  });

  it('scopes select-prompt dependencies to the injected async flow', async () => {
    let message = '';
    const result = await withSelectPrompt(
      (options) => {
        message = options.message ?? '';
        return Promise.resolve('beta');
      },
      () => Cli.Input.Select.prompt({ message: 'Choose:', options: ['alpha', 'beta'] }),
    );

    expect(result).to.eql('beta');
    expect(message).to.eql('Choose:');
  });
});
