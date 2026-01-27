import { type t, Fs } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { EndpointsFs, EndpointYamlSchema } from '../u.endpoints/mod.ts';
import { ValidName } from './is.ts';

type Result = { readonly kind: 'exit' } | { readonly kind: 'selected'; readonly key: string };
type Action = 'select';

/**
 * Presents an interactive menu for selecting or creating deploy endpoints.
 *
 * Endpoints are persisted units of deployment intent:
 * a stable name and an evolving configuration.
 *
 * This function owns only:
 * - selection
 * - creation
 *
 * All endpoint behavior (providers, execution)
 * is intentionally handled elsewhere.
 */
export async function endpointsMenu(cwd: t.StringDir): Promise<Result> {
  const schema = {
    init: () => EndpointYamlSchema.initial(),
    validate: (value: unknown) => EndpointYamlSchema.validate(value),
  } as const;

  const res = await YamlConfig.menu<t.DeployTool.Config.EndpointYaml.Doc, Action>({
    cwd,
    dir: EndpointsFs.dir,
    label: 'Endpoints',
    itemLabel: 'deploy',
    addLabel: '    add: <endpoint>',
    ensureDefault: false,
    schema,
    mode: 'select',
    selectAction: 'select',
    add: {
      message: 'Endpoint display name',
      hint: ValidName.hint,
      validate(value) {
        if (!ValidName.test(value)) return ValidName.hint;
        return true;
      },
      initYaml: ({ name }) => EndpointsFs.initialYaml(name),
    },
  });

  if (res.kind === 'exit') return { kind: 'exit' };
  if (res.kind !== 'action' || res.action !== 'select') return { kind: 'exit' };

  return { kind: 'selected', key: labelFromPath(res.path) };
}

function labelFromPath(path: t.StringPath): string {
  const base = Fs.basename(path);
  return base.endsWith(EndpointsFs.ext) ? base.slice(0, -EndpointsFs.ext.length) : base;
}
