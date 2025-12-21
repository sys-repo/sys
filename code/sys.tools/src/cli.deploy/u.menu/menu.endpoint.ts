import { type t, c, Cli, Fs, Open, Path, Str, Time } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { Fmt } from '../u.fmt.ts';

import { promptEndpointAction } from './u.promptEndpointAction.ts';
import { renderEndpointScreen } from './u.renderEndpointScreen.ts';
import { resolveMappingsForStaging } from './u.resolveMappingsForStaging.ts';
import { runStagingWithSpinner } from './u.runStagingWithSpinner.ts';
import { touchEndpointLastUsed } from './u.touchEndpointLastUsed.ts';

type Pick =
  | { readonly kind: 'back' }
  | { readonly kind: 'renamed'; readonly from: string; readonly to: string }
  | { readonly kind: 'deleted'; readonly key: string };

/**
 * Interactive menu for configuring a single deploy endpoint.
 *
 * Endpoint configuration is authored in YAML:
 *   ./-endpoints/<name>.yaml
 *
 * This menu owns only:
 * - rename (file + config index)
 * - delete (file + config index)
 */
export async function endpointMenu(args: {
  readonly config: t.DeployTool.Config.File;
  readonly key: string;
}): Promise<Pick> {
  const { config } = args;
  let key = args.key;

  const dim = (s: string) => c.gray(c.dim(s));
  const find = (name: string) => (config.current.endpoints ?? []).find((e) => e.name === name);

  let ranOk = false;

  while (true) {
    const ref = find(key);
    if (!ref) return { kind: 'back' };

    const cwd = Fs.dirname(config.fs.path);
    const abs = Fs.join(cwd, ref.file);
    const check = await EndpointsFs.validateYaml(abs);

    const table = await Fmt.endpointTable(cwd, ref);
    console.info(renderEndpointScreen({ table, check }));

    const picked = await promptEndpointAction({ checkOk: check.ok, ranOk });
    if (picked === 'back') return { kind: 'back' };

    if (picked === 'edit') {
      Open.invokeDetached(cwd, String(Path.toFileUrl(abs)), { silent: true });
      continue;
    }

    if (picked === 'run') {
      const file = String(ref.file ?? '');
      const yamlAbs = Fs.join(cwd, file);
      const yamlDir = Fs.dirname(yamlAbs); // endpoint YAML folder

      const resolved = await resolveMappingsForStaging({ cwd, yamlAbs });
      if (!resolved.ok) continue;

      await runStagingWithSpinner({ mappings: resolved.mappings, yamlDir });
      ranOk = true;

      await touchEndpointLastUsed({ config, endpointName: ref.name });
      continue;
    }

    if (picked === 'fix') {
      const rel = ref.file;
      const b = Str.builder()
        .line(c.yellow('Fix errors'))
        .line(c.gray(`file: ${c.dim(rel)}`))
        .line()
        .line(c.gray('Edit the YAML, then re-open this endpoint menu.'));

      console.info(String(b));
      await Cli.Input.Text.prompt({ message: dim('Press enter to continue'), default: '' });
      continue;
    }

    if (picked === 'rename') {
      const exists = (name: string) =>
        (config.current.endpoints ?? []).some((e) => e.name === name);

      const raw = await Cli.Input.Text.prompt({
        message: 'Rename endpoint',
        default: ref.name,
        validate(value) {
          const next = String(value ?? '').trim();
          if (!next) return 'Name required.';
          if (next !== ref.name && exists(next)) return 'Name already exists.';
          return true;
        },
      });

      const nextName = raw.trim();
      if (nextName === ref.name) return { kind: 'back' };

      const fromRel = ref.file;
      const toRel = EndpointsFs.fileOf(nextName);

      const fromAbs = Fs.join(cwd, fromRel);
      const toAbs = Fs.join(cwd, toRel);

      await Fs.ensureDir(Fs.join(cwd, EndpointsFs.dir));

      if (await Fs.exists(fromAbs)) {
        await Fs.move(fromAbs, toAbs);
      } else {
        await EndpointsFs.ensureInitialYaml(toAbs, nextName);
      }

      config.change((doc) => {
        const now = Time.now.timestamp;
        const current = doc.endpoints ?? [];
        const lastUsedAt = now;
        doc.endpoints = current.map((e) => {
          return e.name === ref.name ? { ...e, name: nextName, file: toRel, lastUsedAt } : e;
        });
      });

      await config.fs.save();

      const from = key;
      key = nextName;
      ranOk = false;

      return { kind: 'renamed', from, to: nextName };
    }

    if (picked === 'delete') {
      const yes = await Cli.Input.Confirm.prompt({
        message: `Delete ${c.cyan(ref.name)}?`,
        default: false,
      });

      if (!yes) continue;

      const abs = Fs.join(cwd, ref.file);
      await Fs.remove(abs);

      config.change((doc) => {
        const current = doc.endpoints ?? [];
        doc.endpoints = current.filter((e) => e.name !== ref.name);
      });

      await config.fs.save();
      return { kind: 'deleted', key: ref.name };
    }
  }
}
