import { type t, Schema, Yaml } from '../common.ts';
import { CryptoYamlSchema } from './u.schema.ts';

export const CryptoYamlErrorCode: t.Yaml.Error['code'] = 'BAD_ALIAS';

export function validateCryptoYamlText(text: string): t.CryptoTool.ConfigYaml.YamlCheck {
  const ast = Yaml.parseAst(text);

  if (ast.errors?.length) {
    return {
      ok: false,
      errors: Schema.Error.fromYaml(ast.errors),
    };
  }

  const js = Yaml.toJS<t.CryptoTool.ConfigYaml.Doc>(ast);
  if (!js.ok) {
    return {
      ok: false,
      errors: Schema.Error.fromYaml(Yaml.Diagnostic.toYamlErrors([...js.errors])),
    };
  }

  if (js.data === undefined) {
    const err = Yaml.Error.synthetic({
      message: 'YAML conversion produced no value.',
      code: CryptoYamlErrorCode,
      pos: [0, 0],
    });
    return { ok: false, errors: Schema.Error.fromYaml([err]) };
  }

  const checked = CryptoYamlSchema.validate(js.data);
  if (!checked.ok) {
    return {
      ok: false,
      errors: Schema.Error.fromSchema(ast, checked.errors),
    };
  }

  return { ok: true, doc: js.data };
}
