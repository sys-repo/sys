import { Is, type t, Yaml } from './common.ts';
import { Schema } from '../m.Schema/mod.ts';

/** Parse YAML/unknown input into a Shell.Structure value. */
export const parse: t.ShellStructure.Parse.Fn = (input) => {
  const value = Is.str(input) ? parseYaml(input) : input;
  const validation = Schema.validate(value);
  if (!validation.ok) {
    const reason = validation.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`ShellStructure.parse: invalid Shell.Structure: ${reason}`);
  }
  return validation.value;
};

function parseYaml(input: string): unknown {
  const parsed = Yaml.parse<unknown>(input);
  if (parsed.error) {
    throw new Error(`ShellStructure.parse: invalid YAML: ${parsed.error.message.trim()}`, {
      cause: parsed.error,
    });
  }
  return parsed.data;
}
