import { Cli, describe, expect, it } from '../../-test.ts';
import { FmtDslHelp } from '../mod.ts';

describe('@sys/tools dsl', () => {
  it('renders root guidance with registered chapter routes', async () => {
    const text = Cli.stripAnsi(await FmtDslHelp.output());

    expect(text).to.contain('@sys/tools dsl');
    expect(text).to.contain('Tools DSL');
    expect(text).to.contain('deno run -A jsr:@sys/tools dsl serve');
    expect(text).to.contain('deno run -A jsr:@sys/tools dsl deploy');
    expect(text).to.contain('--format <format>');
    expect(text).to.contain('human');
    expect(text).to.contain('skill');
  });

  it('routes human chapter rendering by path', async () => {
    const serve = Cli.stripAnsi(await FmtDslHelp.output({ path: ['serve'] }));
    const deploy = Cli.stripAnsi(await FmtDslHelp.output({ path: ['deploy'] }));

    expect(serve).to.contain('@sys/tools dsl serve');
    expect(serve).to.contain('Serve roots and public paths.');
    expect(serve).to.contain('Base path check');

    expect(deploy).to.contain('@sys/tools dsl deploy');
    expect(deploy).to.contain('Deploy snapshot replacement, provider push');
    expect(deploy).to.contain('Snapshot replacement');
    expect(deploy).to.contain('Force repair mode');
  });

  it('renders root skill projection with deterministic metadata', async () => {
    const text = await FmtDslHelp.output({ format: 'skill' });

    expect(text).to.contain('name: "sys-tools-dsl"');
    expect(text).to.contain(
      'description: "Guides @sys/tools DSL reading protocol, root ownership, chapter policy, and tool-owner boundaries; use when you are about to change @sys/tools guidance or behavior."',
    );
    expect(text).to.contain('# Tools DSL');
  });

  it('renders chapter skill projection with path-derived metadata', async () => {
    const text = await FmtDslHelp.output({ path: ['deploy'], format: 'skill' });

    expect(text).to.contain('name: "sys-tools-dsl-deploy"');
    expect(text).to.contain(
      'description: "Guides @sys/tools DSL work; use when you need to deploy snapshot replacement, provider push, R2 Files publishing, and force repair mode."',
    );
    expect(text).to.contain('# Deploy DSL');
  });
});
