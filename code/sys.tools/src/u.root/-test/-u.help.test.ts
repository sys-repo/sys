import { Cli, describe, expect, it } from '../../-test.ts';
import { printRootHelp } from '../u.help.ts';

async function captureInfo(fn: () => Promise<void>) {
  const output: string[] = [];
  const original = console.info;
  try {
    console.info = (...data: unknown[]) => {
      output.push(data.map(String).join(' '));
    };
    await fn();
  } finally {
    console.info = original;
  }
  return output.join('\n');
}

describe('Root Help', () => {
  it('documents the update-advisory opt-out flag and env var', async () => {
    const output = await captureInfo(async () => {
      await printRootHelp({ help: true, _: [] });
    });
    const text = Cli.stripAnsi(output);

    expect(text).to.contain('--no-update-check');
    expect(text).to.contain('SYS_TOOLS_NO_UPDATE_CHECK=1');
    expect(text).to.contain('Disable automatic update advisory checks and notices.');
  });
});
