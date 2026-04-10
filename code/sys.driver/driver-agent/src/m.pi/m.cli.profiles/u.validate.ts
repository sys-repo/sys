import { type t, Schema, Yaml } from './common.ts';
import { ProfileSchema } from './u.schema.ts';

/**
 * Fixed `yaml` ErrorCode required to construct a `YAMLError`.
 */
export const ProfileYamlErrorCode: t.Yaml.Error['code'] = 'BAD_ALIAS';

/**
 * Validate profile config YAML content.
 */
export function validateProfileYamlText(text: string): t.PiCliProfiles.Yaml.YamlCheck {
  const ast = Yaml.parseAst(text);

  if (ast.errors?.length) {
    return { ok: false, errors: Schema.Error.fromYaml(ast.errors) };
  }

  const js = Yaml.toJS<t.PiCliProfiles.Yaml.Profile>(ast);
  if (!js.ok) {
    const yamlErrors = Yaml.Diagnostic.toYamlErrors([...js.errors]);
    return { ok: false, errors: Schema.Error.fromYaml(yamlErrors) };
  }

  if (js.data === undefined) {
    const err = Yaml.Error.synthetic({
      message: 'YAML conversion produced no value.',
      code: ProfileYamlErrorCode,
      pos: [0, 0],
    });
    return { ok: false, errors: Schema.Error.fromYaml([err]) };
  }

  const checked = ProfileSchema.validate(js.data);
  if (!checked.ok) return { ok: false, errors: Schema.Error.fromSchema(ast, checked.errors) };

  return { ok: true, doc: js.data };
}
