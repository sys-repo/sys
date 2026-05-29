import { Cli, describe, expect, it } from '../../-test.ts';
import { printRootHelp } from '../u.help.ts';

async function captureInfo(fn: () => Promise<void>) {
  const output: string[] = [];
  const original = console.info;
  try {
    console.info = (...data: unknown[]) => void output.push(data.map(String).join(' '));
    await fn();
  } finally {
    console.info = original;
  }
  return output.join('\n');
}

describe('Root Help', () => {
  it('lists shell in the root help', async () => {
    const output = await captureInfo(async () => void await printRootHelp({ help: true, _: [] }));
    const text = Cli.stripAnsi(output);
    expect(text).to.contain('@sys/tools shell');
    expect(text).to.contain('@sys/tools dsl');
  });

  it('documents the upgrade-advisory opt-out flag and env var', async () => {
    const output = await captureInfo(async () => void await printRootHelp({ help: true, _: [] }));
    const text = Cli.stripAnsi(output);

    expect(text).to.contain('--no-upgrade-check');
    expect(text).to.contain('SYS_TOOLS_NO_UPGRADE_CHECK=1');
    expect(text).to.contain('Disable automatic upgrade advisory checks and notices.');
  });
});
