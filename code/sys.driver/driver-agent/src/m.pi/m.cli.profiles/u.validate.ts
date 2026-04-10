import { type t, Schema, Yaml } from './common.ts';
import { ProfileSetSchema } from './u.schema.ts';

/**
 * Fixed `yaml` ErrorCode required to construct a `YAMLError`.
 */
export const ProfileSetYamlErrorCode: t.Yaml.Error['code'] = 'BAD_ALIAS';

/**
 * Validate environment profile YAML content.
 */
export function validateProfileSetYamlText(text: string): t.PiCliProfiles.Yaml.YamlCheck {
  const ast = Yaml.parseAst(text);

  if (ast.errors?.length) {
    return { ok: false, errors: Schema.Error.fromYaml(ast.errors) };
  }

  const js = Yaml.toJS<t.PiCliProfiles.Yaml.ProfileSet>(ast);
  if (!js.ok) {
    const yamlErrors = Yaml.Diagnostic.toYamlErrors([...js.errors]);
    return { ok: false, errors: Schema.Error.fromYaml(yamlErrors) };
  }

  if (js.data === undefined) {
    const err = Yaml.Error.synthetic({
      message: 'YAML conversion produced no value.',
      code: ProfileSetYamlErrorCode,
      pos: [0, 0],
    });
    return { ok: false, errors: Schema.Error.fromYaml([err]) };
  }

  const checked = ProfileSetSchema.validate(js.data);
  if (!checked.ok) return { ok: false, errors: Schema.Error.fromSchema(ast, checked.errors) };

  return { ok: true, doc: js.data };
}
