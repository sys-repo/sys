import { Cli, describe, expect, Fs, Hash, it, Json, Pkg, Str, type t } from '../../../-test.ts';
import { captureInfo } from '../../-test/u.fixture.ts';
import { withPreviewDist } from '../../-test/u.preview.fixture.ts';
import { EndpointsFs } from '../../u.endpoints/mod.ts';
import { filesHandle } from '../../u.providers/provider.r2/-test/u.fixture.ts';
import { R2Provider } from '../../u.providers/provider.r2/mod.ts';
import { type EndpointMenuDependencies, endpointMenuWith } from '../menu.endpoint.ts';
import { promptEndpointActionWith } from '../u/u.promptEndpointAction.ts';

type Prompt = Parameters<EndpointMenuDependencies['promptAction']>[0];
type Action = t.DeployTool.Endpoint.Menu.Action;

const ENDPOINT_YAML = Str.dedent(`
  provider:
    kind: r2
    accountId: test-account
    bucket: test-bucket
    prefix: site
    readOrigin: https://example.invalid
    credentials:
      accessKeyId: test-key
      secretAccessKey: test-secret
  staging:
    dir: ./staging
  mappings: []
`);

describe('Deploy: endpoint menu / publication status', () => {
  it('real R2 publication report → badge uses content identity, not a manifest-byte checksum', async () => {
    await withPreviewDist(async ({ cwd, root, evidence }) => {
      const yamlPath = await writeYaml(cwd);
      const prompts = await runMenu(cwd, ['push', 'back'], async () => {
        const check = await EndpointsFs.validateYaml(yamlPath, { cwd });
        if (!check.ok || check.doc.provider?.kind !== 'r2') {
          throw new Error('Expected R2 endpoint.');
        }
        const result = await R2Provider.push({
          cwd,
          target: { provider: check.doc.provider, sourceDir: cwd, stagingDir: root },
          createFiles: () => filesHandle({ writes: [] }),
        });
        if (!result.ok) throw result.error;
        const digest = result.publish?.files.find((file) => file.path === 'dist.json')?.digest;
        expect(digest).to.eql(evidence.content.digest);
        expect(digest).not.to.eql(evidence.manifestChecksum);
        return { ok: true, push: { ok: true, publish: result.publish } };
      });
      expect(prompts.map((input) => input.pushedOk)).to.eql([false, true]);
      expect(prompts[1].hashPrefix).to.eql(`#${evidence.content.digest.slice(-5)}`);
    });
  });

  it('stage-push from an absent staging root → retains the newly reported content identity', async () => {
    await withPreviewDist(async ({ cwd, root }) => {
      await writeYaml(cwd);
      await Fs.remove(root);
      const prompts = await runMenu(cwd, ['stage-push', 'back'], async () => {
        await rebuild(root);
        return await publication(root);
      });
      expect(prompts[0].showPush).to.eql(false);
      expect(prompts[0].showStagePush).to.eql(true);
      expect(prompts[1].hasStageMeta).to.eql(true);
      expect(prompts[1].pushedOk).to.eql(true);
    });
  });

  for (const action of ['push', 'stage-push'] as const) {
    it(`${action} succeeds → unchanged reload retains the matching publication status`, async () => {
      await withPreviewDist(async ({ cwd, root, evidence }) => {
        await writeYaml(cwd);
        let digest = evidence.content.digest;
        const prompts = await runMenu(cwd, [action, 'reload', 'back'], async (input) => {
          expect(input.action).to.eql(action);
          if (action === 'stage-push') {
            const computed = await rebuild(root);
            digest = computed.pin.digest;
          }
          return await publication(root);
        });
        expect(prompts.map((input) => input.pushedOk)).to.eql([false, true, true]);
        expect(prompts[2].pushElapsed).to.eql('10ms');
        expect(prompts[2].pushBytes).to.eql(123);
        expect(prompts[2].hasStageMeta).to.eql(true);
        expect(prompts[2].hashPrefix).to.eql(`#${digest.slice(-5)}`);
      });
    });
  }

  const cases = [
    ['stage', 'stage'],
    ['failed-stage', 'stage'],
    ['failed-stage-push', 'stage-push'],
    ['failed-push', 'push'],
  ] as const;

  for (const [next, action] of cases) {
    it(`push A → ${next} → publication status and old transfer metadata are invalidated`, async () => {
      await withPreviewDist(async ({ cwd, root, evidence }) => {
        await writeYaml(cwd);
        let runs = 0;
        const prompts = await runMenu(cwd, ['push', action, 'back'], async (input) => {
          if (++runs === 1) return await publication(root);
          expect(input.action).to.eql(action);
          if (next === 'failed-push') return { ok: false, push: { ok: false } };
          if (next === 'failed-stage') {
            await Fs.remove(`${root}/dist.json`);
            return { ok: false, stageOk: false };
          }
          await rebuild(root);
          return next === 'stage'
            ? { ok: true, stageOk: true }
            : { ok: false, stageOk: true, push: { ok: false } };
        });
        expect(runs).to.eql(2);
        expect(prompts.map((input) => input.pushedOk)).to.eql([false, true, false]);
        expect(prompts[2].pushElapsed).to.eql(undefined);
        expect(prompts[2].pushBytes).to.eql(undefined);
        if (next === 'failed-stage') {
          expect(prompts[2].hasStageMeta).to.eql(false);
          expect(prompts[2].hashPrefix).to.eql('#     ');
          let stage = '';
          await promptEndpointActionWith(prompts[2], ({ options }) => {
            stage = Cli.stripAnsi(options.find((option) => option.value === 'stage')?.name ?? '');
            return Promise.resolve('back');
          });
          expect(stage).to.eql('  #       stage (build)');
        } else if (next !== 'failed-push') {
          expect(prompts[2].hasStageMeta).to.eql(true);
          expect(prompts[2].hashPrefix).not.to.eql(`#${evidence.content.digest.slice(-5)}`);
        }
      });
    });
  }

  it('metadata-only replacement → badge still describes the same published payload, not document bytes', async () => {
    await withPreviewDist(async ({ cwd, root, evidence }) => {
      await writeYaml(cwd);
      const prompts = await runMenu(
        cwd,
        ['push', 'reload', 'back'],
        () => publication(root),
        async (_input, index) => {
          if (index !== 1) return;
          const loaded = await Pkg.Dist.load(root);
          if (loaded.kind !== 'canonical' || !loaded.dist) {
            throw new Error('Expected canonical manifest.');
          }
          const replacement = Json.stringify({
            ...loaded.dist,
            pkg: { name: '@test/other-label', version: '2' },
          }, 2);
          expect(Hash.sha256(replacement)).not.to.eql(evidence.manifestChecksum);
          await Fs.write(`${root}/dist.json`, replacement);
        },
      );
      expect(prompts.map((input) => input.pushedOk)).to.eql([false, true, true]);
      expect(prompts[2].hashPrefix).to.eql(prompts[1].hashPrefix);
    });
  });

  for (const change of ['payload', 'destination', 'credentials'] as const) {
    it(`push A → ${change} changes → reload refuses the stale publication status`, async () => {
      await withPreviewDist(async ({ cwd, root }) => {
        const yamlPath = await writeYaml(cwd);
        const prompts = await runMenu(
          cwd,
          ['push', 'reload', 'back'],
          () => publication(root),
          async (_input, index) => {
            if (index !== 1) return;
            if (change === 'payload') {
              await Fs.write(`${root}/assets/app.js`, 'mutated without restaging');
            } else {
              const yaml = change === 'destination'
                ? ENDPOINT_YAML.replace('prefix: site', 'prefix: other')
                : ENDPOINT_YAML.replace('test-key', 'other-key');
              await Fs.write(yamlPath, yaml);
            }
          },
        );
        expect(prompts.map((input) => input.pushedOk)).to.eql([false, true, false]);
        expect(prompts[2].pushElapsed).to.eql(undefined);
        expect(prompts[2].pushBytes).to.eql(undefined);
        if (change !== 'payload') {
          expect(prompts[2].hasStageMeta).to.eql(true);
          expect(prompts[2].hashPrefix).to.eql(prompts[1].hashPrefix);
        }
      });
    });
  }

  for (const report of ['missing', 'different'] as const) {
    it(`push success with ${report} content evidence → no invented artifact publication status`, async () => {
      await withPreviewDist(async ({ cwd }) => {
        await writeYaml(cwd);
        const prompts = await runMenu(cwd, ['push', 'back'], () => {
          return Promise.resolve({
            ok: true,
            push: {
              ok: true,
              elapsed: '10ms',
              bytes: 123,
              publish: report === 'missing' ? undefined : {
                files: [{ path: 'dist.json', status: 'written', digest: Hash.sha256('other') }],
              },
            },
          });
        });
        expect(prompts.map((input) => input.pushedOk)).to.eql([false, false]);
        expect(prompts[1].pushElapsed).to.eql(undefined);
        expect(prompts[1].pushBytes).to.eql(undefined);
      });
    });
  }
});

async function writeYaml(cwd: string): Promise<string> {
  const path = `${cwd}/-config/@sys.tools.deploy/sample.yaml`;
  await Fs.write(path, ENDPOINT_YAML, { throw: true });
  return path;
}

async function rebuild(root: string) {
  await Fs.write(`${root}/assets/app.js`, 'export const rebuilt = true;\n', { throw: true });
  const computed = await Pkg.Dist.compute({ dir: root, save: true });
  if (computed.kind !== 'computed') throw computed.error;
  return computed;
}

async function publication(root: string): Promise<t.DeployTool.Endpoint.RunResult> {
  const loaded = await Pkg.Dist.load(root);
  if (loaded.kind !== 'canonical' || !loaded.dist) {
    throw new Error('Expected published content identity.');
  }
  return {
    ok: true,
    push: {
      ok: true,
      elapsed: '10ms',
      bytes: 123,
      publish: {
        files: [{ path: 'dist.json', status: 'written', digest: loaded.dist.hash.digest }],
      },
    },
  };
}

async function runMenu(
  cwd: string,
  actions: readonly Action[],
  runAction: EndpointMenuDependencies['runAction'],
  onPrompt?: (input: Prompt, index: number) => Promise<void>,
): Promise<Prompt[]> {
  const prompts: Prompt[] = [];
  const captured = await captureInfo(() =>
    endpointMenuWith({ cwd, key: 'sample' }, {
      async promptAction(input) {
        const index = prompts.length;
        prompts.push({ ...input, hashPrefix: Cli.stripAnsi(input.hashPrefix) });
        await onPrompt?.(input, index);
        const action = actions[index];
        if (!action) throw new Error('Unexpected menu iteration.');
        return action;
      },
      runAction,
    })
  );
  expect(captured.value).to.eql({ kind: 'back' });
  expect(prompts.length).to.eql(actions.length);
  return prompts;
}
