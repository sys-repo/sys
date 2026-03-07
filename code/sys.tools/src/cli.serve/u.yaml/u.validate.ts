import { type t, Schema, Yaml } from '../common.ts';
import { ServeYamlSchema } from './u.schema.ts';

/**
 * Fixed `yaml` ErrorCode required to construct a `YAMLError`.
 *
 * This value is intentionally stable and semantically inert.
 * In this system, all human meaning lives in `message`; the
 * `code` exists solely to satisfy the upstream error shape.
 */
export const ServeYamlErrorCode: t.Yaml.Error['code'] = 'BAD_ALIAS';

/**
 * Validate serve YAML content (pure).
 *
 * - Parse errors → YAML errors
 * - toJS diagnostics → YAML errors
 * - Schema violations → schema errors
 *
 * No throwing. Always returns a YamlCheck.
 */
export function validateServeYamlText(text: string): t.ServeTool.LocationYaml.YamlCheck {
  const ast = Yaml.parseAst(text);

  if (ast.errors?.length) {
    return {
      ok: false,
      errors: Schema.Error.fromYaml(ast.errors),
    };
  }

  const js = Yaml.toJS<t.ServeTool.LocationYaml.Doc>(ast);

  if (!js.ok) {
    const yamlErrors = Yaml.Diagnostic.toYamlErrors([...js.errors]);
    return {
      ok: false,
      errors: Schema.Error.fromYaml(yamlErrors),
    };
  }

  if (js.data === undefined) {
    const err = Yaml.Error.synthetic({
      message: 'YAML conversion produced no value.',
      code: ServeYamlErrorCode,
      pos: [0, 0],
    });

    return {
      ok: false,
      errors: Schema.Error.fromYaml([err]),
    };
  }

  const checked = ServeYamlSchema.validate(js.data);

  if (!checked.ok) {
    return {
      ok: false,
      errors: Schema.Error.fromSchema(ast, checked.errors),
    };
  }

  return {
    ok: true,
    doc: js.data,
  };
}
