import { describe, expect, expectError, Fs, it, Str, Testing } from '../../-test.ts';
import { StripeFixture } from './mod.ts';

describe('StripeFixture strict listener', () => {
  it('honors YAML bind policy and direct overrides on loopback', () =>
    Testing.withTmpDir(async (cwd) => {
      const hostname = '127.0.0.1';
      const blocker = Deno.listen({ hostname, port: 0 });
      const { port } = blocker.addr;
      const strict = { cwd, paths: { config: 'strict.yaml' }, silent: true };
      const preferred = { ...strict, paths: { config: 'preferred.yaml' } };
      const unset = { port: undefined, strictPort: undefined };
      const probe = async (origin: string) => {
        const res = await fetch(`${origin}${StripeFixture.path}`);
        const body = await res.json();
        expect(res.status).to.eql(405);
        expect(res.headers.get('allow')).to.eql('POST');
        expect(body).to.eql({ error: 'Method not allowed.' });
      };

      try {
        const config = Str.dedent(`
          name: stripe:fixture
          hostname: ${hostname}
          port: ${port}
        `);
        await Fs.write(Fs.join(cwd, strict.paths.config), `${config}\nstrictPort: true\n`);
        await Fs.write(Fs.join(cwd, preferred.paths.config), config);

        for (const override of [{}, unset]) {
          const cause = await expectError(async () => {
            await using _server = await StripeFixture.start({ ...strict, ...override });
          });
          expect(cause).to.be.instanceOf(Deno.errors.AddrInUse);
        }

        for (const args of [preferred, { ...strict, strictPort: false }, { ...strict, port: 0 }]) {
          await using alternate = await StripeFixture.start(args);
          expect(alternate.port).not.to.eql(port);
          await probe(alternate.origin);
        }
      } finally {
        blocker.close();
      }

      await using exact = await StripeFixture.start({ ...strict, ...unset });
      expect(exact.port).to.eql(port);
      await probe(exact.origin);
    }));

  it('rejects a quoted boolean in YAML', () =>
    Testing.withTmpDir(async (cwd) => {
      const config = 'fixture.yaml';
      const text = Str.dedent(`
        name: stripe:fixture
        hostname: 127.0.0.1
        port: 9090
        strictPort: 'false'
      `);
      await Fs.write(Fs.join(cwd, config), text);
      await expectError(async () => {
        await using _server = await StripeFixture.start({ cwd, paths: { config }, silent: true });
      }, "config key 'strictPort' must be a boolean");
    }));
});
