import { type t, Yaml } from '../common.ts';
import { Schema } from '@sys/schema';
import { CrdtRepoSchema } from './u.schema.ts';

/**
 * Fixed `yaml` ErrorCode required to construct a `YAMLError`.
 */
export const CrdtRepoYamlErrorCode: t.Yaml.Error['code'] = 'BAD_ALIAS';

/**
 * Validate repo YAML content (pure).
 */
export function validateRepoYamlText(text: string): t.CrdtTool.RepoYaml.YamlCheck {
  const ast = Yaml.parseAst(text);

  if (ast.errors?.length) {
    return { ok: false, errors: Schema.Error.fromYaml(ast.errors) };
  }

  const js = Yaml.toJS<t.CrdtTool.RepoYaml.Doc>(ast);

  if (!js.ok) {
    const yamlErrors = Yaml.Diagnostic.toYamlErrors([...js.errors]);
    return { ok: false, errors: Schema.Error.fromYaml(yamlErrors) };
  }

  if (js.data === undefined) {
    const err = Yaml.Error.synthetic({
      message: 'YAML conversion produced no value.',
      code: CrdtRepoYamlErrorCode,
      pos: [0, 0],
    });
    return { ok: false, errors: Schema.Error.fromYaml([err]) };
  }

  const checked = CrdtRepoSchema.validate(js.data);
  if (!checked.ok) {
    return { ok: false, errors: Schema.Error.fromSchema(ast, checked.errors) };
  }

  return { ok: true, doc: js.data };
}
