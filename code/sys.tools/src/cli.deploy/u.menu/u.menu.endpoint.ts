import { type t, c, Cli, Fs, Path, Str, Time } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { Fmt } from '../u.fmt.ts';
import { executeStaging, stagingConcurrencyDefault } from '../u.staging/mod.ts';

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
  const tail = (p: string) => {
    const s = String(p ?? '').replaceAll('\\', '/');
    const parts = s.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1]! : s;
  };

  let ranOk = false;

  while (true) {
    const ref = find(key);
    if (!ref) return { kind: 'back' };

    const cwd = Fs.dirname(config.fs.path);
    const abs = Fs.join(cwd, ref.file);
    const check = await EndpointsFs.validateYaml(abs);
    const table = await Fmt.endpointTable(cwd, ref);
    const str = Str.builder().blank().line(table);

    if (!check.ok) {
      const validation = Fmt.endpointValidation(check);
      str.blank().line(validation);
    }

    str.blank();
    console.info(String(str));

    const picked = await Cli.Input.Select.prompt<'run' | 'fix' | 'rename' | 'delete' | 'back'>({
      message: `Actions:`,
      options: [
        ...(check.ok
          ? [{ name: ranOk ? c.gray('  run ✔') : c.green('  run'), value: 'run' as const }]
          : []),
        ...(check.ok ? [] : [{ name: c.yellow('  fix errors'), value: 'fix' as const }]),
        { name: '  rename', value: 'rename' },
        { name: dim(' (delete)'), value: 'delete' },
        { name: dim('← back'), value: 'back' },
      ],
      hideDefault: true,
    });

    if (picked === 'back') return { kind: 'back' };

    if (picked === 'run') {
      const file = String(ref.file ?? '');
      const yamlAbs = Fs.join(cwd, file);
      const yamlDir = Fs.dirname(yamlAbs); // endpoint YAML folder
      const rootDir = cwd; // deploy root (config folder)

      type T = { mappings?: readonly t.DeployTool.Staging.Mapping[] };
      const res = await Fs.readYaml<T>(yamlAbs);
      const mappings = res.ok ? (res.data?.mappings ?? []) : [];

      if (mappings.length === 0) {
        console.info(c.gray('No mappings defined.'));
        await Cli.Input.Text.prompt({ message: dim('Press enter to continue'), default: '' });
        continue;
      }

      /**
       * Resolve mapping paths:
       * - source is relative to the endpoint YAML file (yamlDir)
       * - staging is relative to the deploy root (rootDir)
       *
       * We pass cwd=yamlDir into executeStaging so any remaining relative
       * source resolution is correct, while staging is absolute.
       */
      const resolved: readonly t.DeployTool.Staging.Mapping[] = mappings.map((m) => {
        const src = Path.resolve(yamlDir, String(m.dir.source ?? ''));
        const dst = Path.resolve(rootDir, String(m.dir.staging ?? ''));
        return { ...m, dir: { ...m.dir, source: src, staging: dst } };
      });

      const spin = Cli.spinner();
      spin.start(Fmt.spinnerText('Running staging...'));

      const active = new Map<number, string>();
      const total = resolved.length;
      let done = 0;

      const render = (): string => {
        const names = [...active.entries()].sort((a, b) => a[0] - b[0]).map(([, name]) => name);

        const lines: string[] = [];
        lines.push(`Staging (${done}/${total})...`);

        for (const name of names) {
          lines.push(`  - ${name}`);
        }

        return lines.join('\n');
      };

      const refresh = () => {
        spin.text = Fmt.spinnerText(render());
      };

      try {
        await executeStaging(resolved, {
          cwd: yamlDir,
          concurrency: stagingConcurrencyDefault({ total }),
          onProgress(e) {
            if (e.kind === 'mapping:start') {
              active.set(e.index, tail(e.source));
              refresh();
              return;
            }

            if (e.kind === 'mapping:done') {
              done += 1;
              active.delete(e.index);
              refresh();
              return;
            }

            if (e.kind === 'mapping:fail') {
              active.delete(e.index);
              refresh();
              return;
            }

            // mapping:step (and any future events) → keep the spinner stable (names only),
            // but still refresh in case ordering/state changes later.
            refresh();
          },
        });

        ranOk = true;
        spin.succeed(Fmt.spinnerText('Staging complete'));
      } catch (err) {
        spin.fail(Fmt.spinnerText('Staging failed'));
        throw err;
      }

      config.change((doc) => {
        const now = Time.now.timestamp;
        const current = doc.endpoints ?? [];
        doc.endpoints = current.map((e) => (e.name === ref.name ? { ...e, lastUsedAt: now } : e));
      });

      await config.fs.save();
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

      const cwd = Fs.dirname(config.fs.path);
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
        doc.endpoints = current.map((e) =>
          e.name === ref.name ? { ...e, name: nextName, file: toRel, lastUsedAt: now } : e,
        );
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

      const cwd = Fs.dirname(config.fs.path);
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
