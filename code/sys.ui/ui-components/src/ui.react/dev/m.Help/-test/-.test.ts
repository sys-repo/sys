import { describe, expect, it } from '../../../../-test.ts';
import { DevHelpMarkdown } from '../../m.Help.Markdown/mod.ts';
import { DevHelp } from '../mod.ts';

describe('@sys/ui-components/react/dev: Dev.Help', () => {
  it('API', async () => {
    const m = await import('@sys/ui-components/react/dev');
    expect(m.Dev.Help).to.equal(DevHelp);
    expect(m.Dev.Help.Markdown).to.equal(DevHelpMarkdown);
  });
});
