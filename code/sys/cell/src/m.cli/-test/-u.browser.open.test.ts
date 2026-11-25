import { describe, expect, Fs, it, Open, Process, Testing, Time } from './common.ts';
import { openBrowserTarget } from '../u.lifecycle/u.browser.open.ts';

describe('@sys/cell/cli browser handoff', () => {
  it('browser handoff → platform command and one literal href in the recorder argv', async () => {
    await Testing.withTmpDir(async (dir) => {
      const receipt = Fs.join(dir, 'argv.json');
      const recorder = Fs.join(dir, 'record.ts');
      await Fs.write(
        recorder,
        'await Deno.writeTextFile(Deno.args[0], JSON.stringify(Deno.args.slice(1)));',
        { throw: true },
      );
      const href = 'https://example.test/a%20b?x=(one)&y=$two;three#four';
      const invoked: (string | undefined)[] = [];
      openBrowserTarget(href, ({ cmd, args = [] }) => {
        invoked.push(cmd);
        // Replace only the desktop executable; observe its argv in a real child.
        return Process.invokeDetached({
          cmd: Deno.execPath(),
          args: ['run', '--no-config', `--allow-write=${receipt}`, recorder, receipt, ...args],
        });
      });
      expect(invoked).to.eql([Open.resolveCommand(href).cmd]);
      const argv = await Time.waitFor(async () => (await Fs.readText(receipt)).data, {
        timeout: 5_000,
      });
      expect(argv).to.eql(JSON.stringify([href]));
    });
  });

  it('reports a missing direct opener without trying an interpreter', () => {
    const missing = new Deno.errors.NotFound('no desktop opener');
    let attempts = 0;
    const unavailable = () => {
      attempts++;
      throw missing;
    };
    expect(() => openBrowserTarget('https://example.test/', unavailable)).to.throw(missing);
    expect(attempts).to.eql(1);
  });
});
