import { Cli, describe, expect, it } from '../../-test.ts';
import { FmtDslHelp } from '../mod.ts';

describe('@sys/tools dsl', () => {
  it('renders root DSL guidance', async () => {
    const text = Cli.stripAnsi(await FmtDslHelp.output());

    expect(text).to.contain('@sys/tools dsl');
    expect(text).to.contain('Tools DSL');
    expect(text).to.contain('Published chapter: `serve`.');
  });

  it('renders the serve chapter', async () => {
    const text = Cli.stripAnsi(await FmtDslHelp.output({ path: ['serve'] }));

    expect(text).to.contain('@sys/tools dsl serve');
    expect(text).to.contain('Agent contract for `@sys/tools/serve`');
    expect(text).to.contain('`dir` is the filesystem root');
  });

  it('renders skill metadata', async () => {
    const text = await FmtDslHelp.output({ format: 'skill' });

    expect(text).to.contain('name: "sys-tools-dsl"');
    expect(text).to.contain('# Tools DSL');
  });
});
