import { Schema, type t, Yaml } from '../common.ts';
import { endpointPathErrors, EndpointYamlErrorCode } from './u.pathPolicy.ts';
import { EndpointYamlSchema } from './u.schema.ts';

export { EndpointYamlErrorCode } from './u.pathPolicy.ts';

/**
 * Validate endpoint YAML content (pure).
 *
 * - Parse errors → YAML errors
 * - toJS diagnostics → YAML errors
 * - Schema violations → schema errors
 *
 * No throwing. Always returns a YamlCheck.
 */
export function validateEndpointYamlText(text: string): t.DeployTool.Endpoint.Fs.YamlCheck {
  return validateEndpointYamlAst(Yaml.parseAst(text));
}

/**
 * Validate an endpoint YAML AST (pure).
 *
 * Env-ref resolution, if needed, must happen before calling this helper.
 */
export function validateEndpointYamlAst(ast: t.Yaml.Ast): t.DeployTool.Endpoint.Fs.YamlCheck {
  if (ast.errors?.length) {
    return {
      ok: false,
      errors: Schema.Error.fromYaml(ast.errors),
    };
  }

  const js = Yaml.toJS<t.DeployTool.Config.EndpointYaml.Doc>(ast);

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
      code: EndpointYamlErrorCode,
      pos: [0, 0],
    });

    return {
      ok: false,
      errors: Schema.Error.fromYaml([err]),
    };
  }

  const pathErrors = endpointPathErrors(js.data);
  if (pathErrors.length > 0) {
    return {
      ok: false,
      errors: Schema.Error.fromYaml([...pathErrors]),
    };
  }

  const checked = EndpointYamlSchema.validate(js.data);

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
