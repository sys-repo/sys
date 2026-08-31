import { describe, expect, expectError, Fs, it, Str } from '../../-test.ts';
import { parseArgs } from '../u.args.ts';
import { resolveNonInteractive } from '../u.resolve.nonInteractive.ts';

describe('@sys/tools/deploy non-interactive resolution', () => {
  it('resolves --config and maps stage+push to the shared run action', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
    const yamlRel = '-config/@sys.tools.deploy/slc.yaml';
    await Fs.ensureDir(`${cwd}/src/site`);
    await Fs.write(`${cwd}/src/site/index.html`, '<!doctype html><html><body>slc</body></html>\n');
    await Fs.write(
      `${cwd}/${yamlRel}`,
      Str.dedent(
        `
      source:
        dir: ./src
      staging:
        dir: ./stage
      mappings:
        - mode: copy
          dir:
            source: ./site
            staging: .
      `,
      ).trimStart(),
    );

    const res = await resolveNonInteractive(
      cwd,
      parseArgs([
        '--non-interactive',
        '--config',
        `./${yamlRel}`,
        '--action',
        'stage+push',
        '--force',
      ]),
    );

    expect(res.yamlPath).to.eql(`${cwd}/${yamlRel}`);
    expect(res.key).to.eql('slc');
    expect(res.action).to.eql('stage-push');
    expect(res.force).to.eql(true);
  });

  it('requires --config with --non-interactive', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--non-interactive', '--action', 'stage'])),
      'Missing required flag: --config',
    );
  });

  it('requires --action with --non-interactive', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
    await expectError(
      () => resolveNonInteractive(cwd, parseArgs(['--non-interactive', '--config', './x.yaml'])),
      'Missing required flag: --action',
    );
  });

  it('fails clearly for invalid actions', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
    const args = parseArgs(['--non-interactive', '--config', './x.yaml', '--action', 'serve']);
    await expectError(() => resolveNonInteractive(cwd, args), 'Invalid --action');
  });

  it('uses CLI cwd for env refs when --config is outside endpoint dir', async () => {
    const key = 'SAMPLE_DEPLOY_EXTERNAL_SOURCE';
    await withoutProcessEnv(key, async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
      const yamlRel = 'deploy.yaml';
      await Fs.ensureDir(`${cwd}/src/site`);
      await Fs.write(`${cwd}/src/site/index.html`, '<!doctype html><html></html>\n');
      await Fs.write(`${cwd}/.env`, `${key}="./src/site"\n`);
      await Fs.write(
        `${cwd}/${yamlRel}`,
        Str.dedent(`
          staging:
            dir: ./stage
          mappings:
            - mode: copy
              dir:
                source: \${env:${key}}
                staging: .
        `).trimStart(),
      );

      const res = await resolveNonInteractive(
        cwd,
        parseArgs(['--non-interactive', '--config', `./${yamlRel}`, '--action', 'stage']),
      );

      expect(res.yamlPath).to.eql(`${cwd}/${yamlRel}`);
      expect(res.key).to.eql('deploy');
      expect(res.action).to.eql('stage');
    });
  });

  it('fails clearly for missing env refs', async () => {
    const key = 'SAMPLE_DEPLOY_MISSING_ACCOUNT_ID';
    await withoutProcessEnv(key, async () => {
      const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.deploy.resolve.' })).absolute;
      const yamlRel = '-config/@sys.tools.deploy/env-missing.yaml';
      await Fs.ensureDir(`${cwd}/-config/@sys.tools.deploy`);
      await Fs.write(
        `${cwd}/${yamlRel}`,
        Str.dedent(`
          provider:
            kind: r2
            accountId: \${env:${key}}
            bucket: deploy-bucket
            prefix: deploy/site
            credentials:
              accessKeyId: key-1
              secretAccessKey: secret-1
          staging:
            dir: ./stage
          mappings: []
        `).trimStart(),
      );

      const args = parseArgs([
        '--non-interactive',
        '--config',
        `./${yamlRel}`,
        '--action',
        'stage',
      ]);
      await expectError(
        () => resolveNonInteractive(cwd, args),
        `provider.accountId references missing env var: ${key}`,
      );
    });
  });
});

/**
 * Helpers:
 */
const withoutProcessEnv = async (key: string, fn: () => Promise<void>) => {
  const original = Deno.env.get(key);
  Deno.env.delete(key);
  try {
    await fn();
  } finally {
    if (original != null) Deno.env.set(key, original);
  }
};
