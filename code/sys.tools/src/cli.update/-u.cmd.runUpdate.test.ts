import { describe, expect, it, Cli, type t } from '../-test.ts';
import { runUpdate } from './u.cmd.runUpdate.ts';

describe('cli.update.runUpdate', () => {
  it('shows a version-check spinner and exits without prompting when already latest', async () => {
    const events: string[] = [];
    let prompted = false;
    let refreshed = false;

    await runUpdate('/tmp' as t.StringDir, { interactive: true }, {
      getVersionInfo: async () => ({
        local: '0.0.318',
        remote: '0.0.318',
        latest: '0.0.318',
        is: { latest: true },
      }),
      refreshCache: async () => {
        refreshed = true;
        return {
          success: true,
          code: 0,
          text: { stdout: '', stderr: '' },
          toString: () => '',
        };
      },
      prompt: async () => {
        prompted = true;
        return 'update';
      },
      spinner: () => spinner(events),
      info: (...data) => {
        events.push(`info:${data.map(String).join(' ')}`);
      },
    });

    const plain = events.map((line) => Cli.stripAnsi(line));
    expect(plain[0]).to.include('start:checking latest @sys/tools version...');
    expect(plain[1]).to.eql('stop');
    expect(plain.some((line) => line.includes('Local version 0.0.318 of @sys/tools is the most recent release'))).to.eql(true);
    expect(prompted).to.eql(false);
    expect(refreshed).to.eql(false);
  });

  it('checks latest first, then prompts, then runs the refresh spinner', async () => {
    const events: string[] = [];

    await runUpdate('/tmp' as t.StringDir, { interactive: true }, {
      getVersionInfo: async () => ({
        local: '0.0.318',
        remote: '0.0.319',
        latest: '0.0.319',
        is: { latest: false },
      }),
      refreshCache: async () => ({
        success: true,
        code: 0,
        text: { stdout: '', stderr: '' },
        toString: () => '',
      }),
      prompt: async () => {
        events.push('prompt');
        return 'update';
      },
      spinner: () => spinner(events),
      info: (...data) => {
        events.push(`info:${data.map(String).join(' ')}`);
      },
    });

    const plain = events.map((line) => Cli.stripAnsi(line));
    expect(plain[0]).to.include('start:checking latest @sys/tools version...');
    expect(plain[1]).to.eql('stop');
    expect(plain).to.include('prompt');
    expect(plain.findIndex((line) => line.includes('start:checking latest @sys/tools version...'))).to.be.lessThan(
      plain.indexOf('prompt'),
    );
    expect(plain.findIndex((line) => line.includes('start:updating @sys/tools from 0.0.318 to 0.0.319...'))).to.be.greaterThan(
      plain.indexOf('prompt'),
    );
  });
});

function spinner(events: string[]) {
  return {
    text: '',
    start(text?: string) {
      events.push(`start:${Cli.stripAnsi(String(text ?? ''))}`);
      this.text = String(text ?? '');
      return this;
    },
    stop() {
      events.push('stop');
      return this;
    },
    succeed(text?: string) {
      events.push(`succeed:${Cli.stripAnsi(String(text ?? ''))}`);
      this.text = String(text ?? '');
      return this;
    },
    fail(text?: string) {
      events.push(`fail:${Cli.stripAnsi(String(text ?? ''))}`);
      this.text = String(text ?? '');
      return this;
    },
  };
}
