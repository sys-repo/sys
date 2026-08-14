import process from 'node:process';
import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Spinner, withSpinner } from '../mod.ts';

type OraTestInstance = t.CliSpinner.Instance & { readonly _stream: unknown };

describe('CLI: Spinner', () => {
  it('maps semantic creation targets to the corresponding Ora stream', () => {
    const previousNodeEnv = Deno.env.get('NODE_ENV');
    Deno.env.set('NODE_ENV', 'test');

    try {
      const target: t.CliSpinner.OutputTarget = 'stdout';
      const options: t.CliSpinner.Create.Options = { target };
      const spinner = Spinner.create('', options);
      const stdout = spinner as OraTestInstance;
      const stderr = Spinner.create('', { target: 'stderr' }) as OraTestInstance;
      const fallback = Spinner.create() as OraTestInstance;

      expectTypeOf(spinner).toEqualTypeOf<t.CliSpinner.Instance>();
      expectTypeOf(options).toEqualTypeOf<t.Cli.Spinner.Create.Options>();
      expect(stdout._stream).to.equal(process.stdout);
      expect(stderr._stream).to.equal(process.stderr);
      expect(fallback._stream).to.equal(process.stderr);
    } finally {
      if (previousNodeEnv === undefined) Deno.env.delete('NODE_ENV');
      else Deno.env.set('NODE_ENV', previousNodeEnv);
    }
  });

  it('preserves the public async composition contract', async () => {
    expectTypeOf(Spinner).toEqualTypeOf<t.CliSpinner.Lib>();
    expect(Spinner.with.name).to.equal('with');
    expect(Spinner.with.length).to.equal(2);
    expect(Spinner.with.constructor.name).to.equal('AsyncFunction');
    expect(await Spinner.with('', async () => 42, { silent: true })).to.equal(42);
  });

  it('stops the spinner after async work', async () => {
    const events: string[] = [];
    const result = await withSpinner(
      (text = '') => {
        events.push(`start:${text}`);
        return {
          text,
          start(next = text) {
            events.push(`restart:${next}`);
            this.text = next;
            return this;
          },
          stop() {
            events.push('stop');
            return this;
          },
          succeed(next = text) {
            events.push(`succeed:${next}`);
            this.text = next;
            return this;
          },
          fail(next = text) {
            events.push(`fail:${next}`);
            this.text = next;
            return this;
          },
        };
      },
      'working...',
      async (spinner) => {
        spinner.text = 'done';
        return 42;
      },
    );

    expect(result).to.eql(42);
    expect(events).to.eql(['start:working...', 'stop']);
  });
});
